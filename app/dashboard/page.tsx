import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { Driver } from "@/models/Driver";
import { Trip } from "@/models/Trip";
import { Expense } from "@/models/Expense";
import { MaintenanceLog } from "@/models/MaintenanceLog";
import { FuelLog } from "@/models/FuelLog";
import { AlertCircle, ArrowUpRight, DollarSign, Fuel, ShieldAlert, TrendingUp, Truck, Users, CheckCircle, Wrench, Route } from "lucide-react";
import { DashboardCharts } from "@/components/analytics/DashboardCharts";
import { RegionSelector } from "@/components/analytics/RegionSelector";
import { DriverCompleteButton } from "@/components/trips/DriverCompleteButton";
import { DriverFuelModal } from "@/components/trips/DriverFuelModal";

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
  const selectedRegion = params.region?.toString() || "All";
  const hasRegion = selectedRegion !== "All";

  await connectToDatabase();

  const userEmail = session.user.email;
  const userRole = (session.user as any).role;

  if (userRole === "Driver") {
    const driverDoc = await Driver.findOne({ email: userEmail }).lean();
    if (!driverDoc) {
      return (
        <div className="space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/20 dark:text-amber-400">
            <h1 className="text-xl font-bold">Driver Profile Not Found</h1>
            <p className="mt-2 text-sm">
              Your account has the "Driver" role, but no corresponding driver profile matching your email (<strong>{userEmail}</strong>) was found in the database. Please contact an administrator to complete your registration.
            </p>
          </div>
        </div>
      );
    }

    // Fetch assigned trips
    const assignedTrips = await Trip.find({ driverId: driverDoc._id })
      .populate("vehicleId")
      .populate("driverId")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch vehicles for the fuel log fallback selector
    const activeVehiclesList = await Vehicle.find({ isDeleted: false })
      .sort({ name: 1 })
      .lean();

    const activeTrip = assignedTrips.find((t) => ["Draft", "Dispatched"].includes(t.status));
    const completedTripsCount = assignedTrips.filter((t) => t.status === "Completed").length;

    const serializedActiveTrip = activeTrip ? JSON.parse(JSON.stringify(activeTrip)) : null;
    const serializedVehiclesList = JSON.parse(JSON.stringify(activeVehiclesList));

    return (
      <div className="space-y-6">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(14,165,233,0.08)] dark:border-sky-950/20 dark:bg-zinc-900/40">
          <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-sky-200/20 blur-2xl dark:bg-sky-500/10" />
          <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-blue-200/15 blur-2xl dark:bg-blue-500/5" />
          <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Hello, {driverDoc.name}!
              </h1>
              <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                Driver Portal Dashboard • {driverDoc.region || "North"} Region
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-lg leading-relaxed">
                Manage your assigned trips, update odometer readings and cargo reports directly from your dashboard.
              </p>
            </div>
            <div className="shrink-0 bg-zinc-50/50 backdrop-blur dark:bg-zinc-950/25 p-1.5 rounded-xl border border-zinc-200/65 dark:border-zinc-800/40">
              <DriverFuelModal activeTrip={serializedActiveTrip} vehicles={serializedVehiclesList} />
            </div>
          </div>
        </div>

        {/* Personalized Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Safety Score
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${
                driverDoc.safetyScore >= 90 ? "text-emerald-600" : driverDoc.safetyScore >= 75 ? "text-amber-600" : "text-red-600"
              }`}>
                {driverDoc.safetyScore}/100
              </span>
              <span className="text-xs text-zinc-500">Commercial Standard</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Assigned Trips
            </span>
            <div className="mt-3">
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {assignedTrips.length}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Completed Trips
            </span>
            <div className="mt-3">
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {completedTripsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Active Trip Control Center */}
        <div className="mt-6">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
            Active Trip Control Center
          </h2>
          {serializedActiveTrip ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50/10 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400">
                      {serializedActiveTrip.status}
                    </span>
                    <span className="text-xs text-zinc-400">ID: {serializedActiveTrip._id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-2">
                    {serializedActiveTrip.source} &rarr; {serializedActiveTrip.destination}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Vehicle: {serializedActiveTrip.vehicleId?.name} ({serializedActiveTrip.vehicleId?.registrationNumber}) • Cargo Weight: {serializedActiveTrip.cargoWeight} kg
                  </p>
                </div>
                <div>
                  {serializedActiveTrip.status === "Draft" ? (
                    <form action={async () => {
                      "use server";
                      const { dispatchTrip } = await import("@/actions/trips");
                      await dispatchTrip(serializedActiveTrip._id);
                    }}>
                      <button
                        type="submit"
                        className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow transition-all cursor-pointer"
                      >
                        Start Trip / Dispatch
                      </button>
                    </form>
                  ) : (
                    <DriverCompleteButton trip={serializedActiveTrip} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <p className="text-sm font-medium">No active trips assigned currently.</p>
              <p className="text-xs mt-1">Check back later or contact your dispatcher for route assignments.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const vehicleQuery: any = { isDeleted: false };
  const driverQuery: any = {};
  if (hasRegion) {
    vehicleQuery.region = selectedRegion;
    driverQuery.region = selectedRegion;
  }

  // Fetch vehicles for this region to filter trips/expenses
  const regionVehicles = await Vehicle.find(vehicleQuery).select("_id").lean();
  const regionVehicleIds = regionVehicles.map((v) => v._id);

  const tripQuery: any = {};
  const expenseQuery: any = {};
  if (hasRegion) {
    tripQuery.vehicleId = { $in: regionVehicleIds };
    expenseQuery.vehicleId = { $in: regionVehicleIds };
  }

  // 1. Vehicles Stats
  const activeVehicles = await Vehicle.countDocuments({ ...vehicleQuery, status: "On Trip" });
  const availableVehicles = await Vehicle.countDocuments({ ...vehicleQuery, status: "Available" });
  const vehiclesInMaintenance = await Vehicle.countDocuments({ ...vehicleQuery, status: "In Shop" });
  const retiredVehicles = await Vehicle.countDocuments({ ...vehicleQuery, status: "Retired" });
  const totalActiveFleet = activeVehicles + availableVehicles + vehiclesInMaintenance;

  // 2. Drivers Stats
  const driversOnDuty = await Driver.countDocuments({ ...driverQuery, status: "On Trip" });
  const driversAvailable = await Driver.countDocuments({ ...driverQuery, status: "Available" });

  // 3. Trips Stats
  const activeTrips = await Trip.countDocuments({ ...tripQuery, status: "Dispatched" });
  const pendingTrips = await Trip.countDocuments({ ...tripQuery, status: "Draft" });

  // 4. Calculations
  const fleetUtilization = totalActiveFleet > 0 ? (activeVehicles / totalActiveFleet) * 100 : 0;

  // Fuel Efficiency
  const completedTrips = await Trip.find({ ...tripQuery, status: "Completed" }).lean();
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
  const allExpenses = await Expense.find(expenseQuery).lean();
  const operationalCost = allExpenses.reduce((sum, e) => sum + e.amount, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentExpenses = await Expense.find({ ...expenseQuery, date: { $gte: thirtyDaysAgo } }).lean();
  const monthlyExpenses = recentExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Overall ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
  const activeVehiclesList = await Vehicle.find(vehicleQuery).lean();
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
  const allTrips = await Trip.find(tripQuery).lean();
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

  // Weather alerts based on selected region
  let weatherAlert = {
    status: "Clear / Optimal",
    details: "All main transport routes are clear. Optimal driving conditions.",
    severity: "info",
  };

  if (selectedRegion === "East") {
    weatherAlert = {
      status: "Rain Advisory",
      details: "Wet road surfaces on Route 9. Drivers advised to maintain safe headways.",
      severity: "warning",
    };
  } else if (selectedRegion === "West") {
    weatherAlert = {
      status: "Heavy Wind Warning",
      details: "High-profile vehicles should exercise caution on coastal bridges.",
      severity: "warning",
    };
  } else if (selectedRegion === "South") {
    weatherAlert = {
      status: "Optimal / Clear",
      details: "Dry roadways, normal traffic flow across regional corridors.",
      severity: "success",
    };
  } else if (selectedRegion === "North") {
    weatherAlert = {
      status: "Congestion Alert",
      details: "Moderate traffic delays near metropolitan interchanges. Expect +15 min transit times.",
      severity: "info",
    };
  } else {
    weatherAlert = {
      status: "Normal Operations",
      details: "No critical weather disruptions reported across the national transport corridors.",
      severity: "success",
    };
  }

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
      <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(14,165,233,0.08)] dark:border-sky-950/20 dark:bg-zinc-900/40">
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-sky-200/20 blur-2xl dark:bg-sky-500/10" />
        <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-blue-200/15 blur-2xl dark:bg-blue-500/5" />
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Welcome back, {session.user.name}
            </h1>
            <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
              Smart Transport Operations Control Dashboard {selectedRegion !== "All" && `(${selectedRegion} Region)`}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-lg leading-relaxed">
              Here is the active operational health, fleet utilization, and financial summary of your transport operations today.
            </p>
          </div>
          <div className="shrink-0 bg-zinc-50/50 backdrop-blur dark:bg-zinc-950/25 p-1.5 rounded-xl border border-zinc-200/65 dark:border-zinc-800/40">
            <RegionSelector />
          </div>
        </div>
      </div>

      {/* Weather & Quick Action Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weather Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between animate-fade-in">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Weather &amp; Route Advisory
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                weatherAlert.severity === "warning"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                  : weatherAlert.severity === "success"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
              }`}>
                {weatherAlert.status}
              </span>
            </div>
            <p className="mt-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {weatherAlert.details}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800 text-[10px] text-zinc-400">
            <span>Region: <strong>{selectedRegion}</strong></span>
            <span>Status: Active</span>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            Quick Action Panel
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <a
              href="/dashboard/trips"
              className="flex flex-col items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-center transition-all hover:bg-sky-50/30 hover:border-sky-200 dark:border-zinc-800 dark:bg-zinc-950/20 dark:hover:bg-zinc-800/40"
            >
              <Route className="h-5 w-5 text-sky-600 dark:text-sky-400 mb-1.5" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Dispatch Trip</span>
            </a>
            <a
              href="/dashboard/vehicles"
              className="flex flex-col items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-center transition-all hover:bg-sky-50/30 hover:border-sky-200 dark:border-zinc-800 dark:bg-zinc-950/20 dark:hover:bg-zinc-800/40"
            >
              <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-1.5" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Fleet Registry</span>
            </a>
            <a
              href="/dashboard/maintenance"
              className="flex flex-col items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-center transition-all hover:bg-sky-50/30 hover:border-sky-200 dark:border-zinc-800 dark:bg-zinc-950/20 dark:hover:bg-zinc-800/40"
            >
              <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-1.5" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Maint Shop</span>
            </a>
            <a
              href="/dashboard/expenses"
              className="flex flex-col items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-center transition-all hover:bg-sky-50/30 hover:border-sky-200 dark:border-zinc-800 dark:bg-zinc-950/20 dark:hover:bg-zinc-800/40"
            >
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-1.5" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Record Expense</span>
            </a>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (7 Cards matching Excalidraw Mockup) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {/* Card 1: Active Vehicles */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Active Vehicles
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 animate-pulse">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {activeVehicles}
            </span>
            <span className="text-[10px] text-zinc-400">/ {totalActiveFleet} active</span>
          </div>
        </div>

        {/* Card 2: Available Vehicles */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Available
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {availableVehicles}
            </span>
          </div>
        </div>

        {/* Card 3: Vehicles in Maintenance */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              In Maintenance
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {vehiclesInMaintenance}
            </span>
          </div>
        </div>

        {/* Card 4: Active Trips */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Active Trips
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
              <Route className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {activeTrips}
            </span>
          </div>
        </div>

        {/* Card 5: Pending Trips */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Pending Trips
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {pendingTrips}
            </span>
          </div>
        </div>

        {/* Card 6: Drivers On Duty */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Drivers On Duty
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {driversOnDuty}
            </span>
            <span className="text-[10px] text-zinc-400">/ {driversAvailable + driversOnDuty} active</span>
          </div>
        </div>

        {/* Card 7: Utilization % */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Fleet Util %
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {Math.round(fleetUtilization)}%
            </span>
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
