import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { Driver } from "@/models/Driver";
import { Trip } from "@/models/Trip";
import { Expense } from "@/models/Expense";
import { MaintenanceLog } from "@/models/MaintenanceLog";
import { FuelLog } from "@/models/FuelLog";
import { AlertCircle, ArrowUpRight, DollarSign, Fuel, ShieldAlert, TrendingUp, Truck, Users } from "lucide-react";
import { DashboardCharts } from "@/components/analytics/DashboardCharts";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const isUnauthorized = params.error === "unauthorized";

  await connectToDatabase();

  // 1. Vehicles Stats
  const activeVehicles = await Vehicle.countDocuments({ status: "On Trip", isDeleted: false });
  const availableVehicles = await Vehicle.countDocuments({ status: "Available", isDeleted: false });
  const vehiclesInMaintenance = await Vehicle.countDocuments({ status: "In Shop", isDeleted: false });
  const retiredVehicles = await Vehicle.countDocuments({ status: "Retired", isDeleted: false });
  const totalActiveFleet = activeVehicles + availableVehicles + vehiclesInMaintenance;

  // 2. Drivers Stats
  const driversOnDuty = await Driver.countDocuments({ status: "On Trip" });
  const driversAvailable = await Driver.countDocuments({ status: "Available" });

  // 3. Trips Stats
  const activeTrips = await Trip.countDocuments({ status: "Dispatched" });
  const pendingTrips = await Trip.countDocuments({ status: "Draft" });

  // 4. Calculations
  const fleetUtilization = totalActiveFleet > 0 ? (activeVehicles / totalActiveFleet) * 100 : 0;

  // Fuel Efficiency
  const completedTrips = await Trip.find({ status: "Completed" }).lean();
  let totalDistance = 0;
  let totalFuelConsumed = 0;
  let totalRevenue = 0;
  completedTrips.forEach((t) => {
    if (t.actualDistance) totalDistance += t.actualDistance;
    if (t.fuelConsumed) totalFuelConsumed += t.fuelConsumed;
    totalRevenue += t.revenue;
  });
  const avgFuelEfficiency = totalFuelConsumed > 0 ? totalDistance / totalFuelConsumed : 0;

  // Expenses & Operational Cost
  const allExpenses = await Expense.find({}).lean();
  const operationalCost = allExpenses.reduce((sum, e) => sum + e.amount, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentExpenses = await Expense.find({ date: { $gte: thirtyDaysAgo } }).lean();
  const monthlyExpenses = recentExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Overall ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
  const activeVehiclesList = await Vehicle.find({ isDeleted: false }).lean();
  const totalAcqCost = activeVehiclesList.reduce((sum, v) => sum + v.acquisitionCost, 0);
  const totalMaintCost = allExpenses
    .filter((e) => e.category === "Maintenance")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalFuelCost = allExpenses
    .filter((e) => e.category === "Fuel")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalROI = totalAcqCost > 0 ? ((totalRevenue - (totalMaintCost + totalFuelCost)) / totalAcqCost) * 100 : 0;

  // Chart 1: Vehicle status distribution
  const vehicleStatusData = [
    { name: "Available", value: availableVehicles },
    { name: "On Trip", value: activeVehicles },
    { name: "In Shop", value: vehiclesInMaintenance },
    { name: "Retired", value: retiredVehicles },
  ];

  // Chart 2: Daily fuel cost (grouped by day in last 30 days)
  const fuelExpenses = allExpenses.filter(
    (e) => e.category === "Fuel" && new Date(e.date) >= thirtyDaysAgo
  );
  const dailyFuelMap: { [key: string]: number } = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
    dailyFuelMap[dateStr] = 0;
  }
  fuelExpenses.forEach((e) => {
    const dateStr = new Date(e.date).toLocaleDateString([], { month: "short", day: "numeric" });
    if (dailyFuelMap[dateStr] !== undefined) {
      dailyFuelMap[dateStr] += e.amount;
    }
  });
  const fuelCostData = Object.keys(dailyFuelMap).map((date) => ({
    name: date,
    amount: dailyFuelMap[date],
  }));

  // Chart 3: Trips per month
  const monthlyTripsMap: { [key: string]: number } = {
    Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
    Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0,
  };
  const allTrips = await Trip.find({}).lean();
  allTrips.forEach((t) => {
    const month = new Date(t.createdAt).toLocaleDateString([], { month: "short" });
    if (monthlyTripsMap[month] !== undefined) {
      monthlyTripsMap[month]++;
    }
  });
  const tripsPerMonthData = Object.keys(monthlyTripsMap).map((month) => ({
    name: month,
    trips: monthlyTripsMap[month],
  }));

  // Chart 4: Maintenance Cost by Vehicle Type
  const maintenanceExpenses = allExpenses.filter((e) => e.category === "Maintenance");
  const maintTypeMap: { [key: string]: number } = {};
  for (const exp of maintenanceExpenses) {
    const v = activeVehiclesList.find((veh) => veh._id.toString() === exp.vehicleId?.toString());
    const vType = v?.type || "General";
    maintTypeMap[vType] = (maintTypeMap[vType] || 0) + exp.amount;
  }
  const maintenanceCostData = Object.keys(maintTypeMap).map((type) => ({
    name: type,
    cost: maintTypeMap[type],
  }));

  // Chart 5: Utilization % by type
  const typeMap: { [key: string]: { total: number; active: number } } = {};
  activeVehiclesList.forEach((v) => {
    if (!typeMap[v.type]) {
      typeMap[v.type] = { total: 0, active: 0 };
    }
    typeMap[v.type].total++;
    if (v.status === "On Trip") {
      typeMap[v.type].active++;
    }
  });
  const fleetUtilizationData = Object.keys(typeMap).map((type) => ({
    name: type,
    utilization: Math.round((typeMap[type].active / typeMap[type].total) * 100),
  }));

  // Chart 6: Top Vehicles ROI (individual)
  const roiData = await Promise.all(
    activeVehiclesList.slice(0, 5).map(async (v) => {
      const vTrips = allTrips.filter(
        (t) => t.vehicleId?.toString() === v._id.toString() && t.status === "Completed"
      );
      const rev = vTrips.reduce((sum, t) => sum + t.revenue, 0);

      const vMaint = allExpenses.filter(
        (e) => e.vehicleId?.toString() === v._id.toString() && e.category === "Maintenance"
      );
      const maint = vMaint.reduce((sum, e) => sum + e.amount, 0);

      const vFuel = allExpenses.filter(
        (e) => e.vehicleId?.toString() === v._id.toString() && e.category === "Fuel"
      );
      const fuel = vFuel.reduce((sum, e) => sum + e.amount, 0);

      const vehRoi = v.acquisitionCost > 0 ? ((rev - (maint + fuel)) / v.acquisitionCost) * 100 : 0;
      return {
        name: v.registrationNumber,
        roi: Math.round(vehRoi),
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Access Warning Alert */}
      {isUnauthorized && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-400">
          <ShieldAlert className="h-5 w-5" />
          <div className="text-sm font-semibold">
            Access Denied: You do not have permission to view that section.
          </div>
        </div>
      )}

      {/* Welcome banner */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome back, {session.user.name}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Here is the active operational health of your fleet today.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Active Vehicles
            </span>
            <Truck className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {activeVehicles}
            </span>
            <span className="text-xs text-zinc-500">/ {totalActiveFleet} active</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {availableVehicles} available • {vehiclesInMaintenance} in shop
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Fleet Utilization
            </span>
            <TrendingUp className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {Math.round(fleetUtilization)}%
            </span>
            <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> Optimal
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {driversOnDuty} drivers currently on duty
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Fuel Efficiency
            </span>
            <Fuel className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {avgFuelEfficiency ? avgFuelEfficiency.toFixed(2) : "0.00"}
            </span>
            <span className="text-xs text-zinc-500">km / Liter</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Across {completedTrips.length} completed trips
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Monthly Expenses
            </span>
            <DollarSign className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              ${monthlyExpenses.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500">USD</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Total Operational: ${operationalCost.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
          Fleet Performance Analytics
        </h2>
        <DashboardCharts
          vehicleStatusData={vehicleStatusData}
          fuelCostData={fuelCostData}
          tripsPerMonthData={tripsPerMonthData}
          maintenanceCostData={maintenanceCostData}
          fleetUtilizationData={fleetUtilizationData}
          roiData={roiData}
        />
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
