"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

interface DashboardChartsProps {
  vehicleStatusData: { name: string; value: number }[];
  fuelCostData: { name: string; amount: number }[];
  tripsPerMonthData: { name: string; trips: number }[];
  maintenanceCostData: { name: string; cost: number }[];
  fleetUtilizationData: { name: string; utilization: number }[];
  roiData: { name: string; roi: number }[];
}

const COLORS = ["#000000", "#3f3f46", "#71717a", "#d4d4d8"];
const DARK_COLORS = ["#ffffff", "#a1a1aa", "#71717a", "#3f3f46"];

export function DashboardCharts({
  vehicleStatusData,
  fuelCostData,
  tripsPerMonthData,
  maintenanceCostData,
  fleetUtilizationData,
  roiData,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-[300px] w-full animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* 1. Vehicle Status Pie */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400">
          Vehicle Fleet Distribution
        </h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={vehicleStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {vehicleStatusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    className="fill-zinc-950 dark:fill-zinc-50"
                    fill={entry.name === "Available" ? "#18181b" : "#71717a"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Fuel Cost Line Chart */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400">
          Daily Fuel Spend (Last 30 Days)
        </h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fuelCostData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} unit="$" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="amount"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                className="stroke-zinc-950 dark:stroke-zinc-50"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Trips Per Month */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400">
          Monthly Dispatched Trips
        </h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tripsPerMonthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="trips" radius={[4, 4, 0, 0]} className="fill-zinc-950 dark:fill-zinc-50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Maintenance Cost */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400">
          Maintenance Cost by Vehicle Type
        </h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maintenanceCostData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} unit="$" />
              <Tooltip />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]} className="fill-zinc-500 dark:fill-zinc-400" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Fleet Utilization Area */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400">
          Utilization % by Vehicle Type
        </h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fleetUtilizationData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} unit="%" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="utilization"
                className="fill-zinc-200 dark:fill-zinc-800 stroke-zinc-950 dark:stroke-zinc-50"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Vehicle ROI */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400">
          Return on Investment (ROI) by Top Vehicles
        </h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roiData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} unit="%" />
              <Tooltip />
              <Bar dataKey="roi" radius={[4, 4, 0, 0]} className="fill-zinc-800 dark:fill-zinc-200" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
export default DashboardCharts;
