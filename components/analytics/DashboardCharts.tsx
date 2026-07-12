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

  const tooltipProps = {
    contentStyle: {
      backgroundColor: "var(--chart-tooltip-bg)",
      borderColor: "var(--chart-tooltip-border)",
      borderRadius: "8px",
      color: "var(--foreground)",
    },
    itemStyle: {
      color: "var(--foreground)",
    },
    labelStyle: {
      color: "var(--foreground)",
      fontWeight: "bold",
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* 1. Vehicle Status Pie */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:shadow-md transition-all duration-300">
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
                {vehicleStatusData.map((entry, index) => {
                  let cellFill = "#94a3b8"; // retired / default
                  if (entry.name === "Available") cellFill = "#0ea5e9";
                  else if (entry.name === "On Trip") cellFill = "#0284c7";
                  else if (entry.name === "In Shop") cellFill = "#f59e0b"; // Warning/maint
                  else if (entry.name === "Retired") cellFill = "#64748b";
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={cellFill}
                    />
                  );
                })}
              </Pie>
              <Tooltip {...tooltipProps} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Fuel Cost Line Chart */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:shadow-md transition-all duration-300">
        <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400">
          Daily Fuel Spend (Last 30 Days)
        </h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fuelCostData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="var(--chart-label)" />
              <YAxis fontSize={10} tickLine={false} axisLine={false} unit="$" stroke="var(--chart-label)" />
              <Tooltip {...tooltipProps} />
              <Line
                type="monotone"
                dataKey="amount"
                strokeWidth={2.5}
                stroke="#0ea5e9"
                activeDot={{ r: 6 }}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Trips Per Month */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:shadow-md transition-all duration-300">
        <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400">
          Monthly Dispatched Trips
        </h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tripsPerMonthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="var(--chart-label)" />
              <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="var(--chart-label)" />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="trips" radius={[4, 4, 0, 0]} fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Maintenance Cost */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:shadow-md transition-all duration-300">
        <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400">
          Maintenance Cost by Vehicle Type
        </h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maintenanceCostData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="var(--chart-label)" />
              <YAxis fontSize={10} tickLine={false} axisLine={false} unit="$" stroke="var(--chart-label)" />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]} fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Fleet Utilization Area */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:shadow-md transition-all duration-300">
        <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400">
          Utilization % by Vehicle Type
        </h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fleetUtilizationData}>
              <defs>
                <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="var(--chart-label)" />
              <YAxis fontSize={10} tickLine={false} axisLine={false} unit="%" stroke="var(--chart-label)" />
              <Tooltip {...tooltipProps} />
              <Area
                type="monotone"
                dataKey="utilization"
                stroke="#0ea5e9"
                fillOpacity={1}
                fill="url(#colorUtil)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Vehicle ROI */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:shadow-md transition-all duration-300">
        <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400">
          Return on Investment (ROI) by Top Vehicles
        </h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roiData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="var(--chart-label)" />
              <YAxis fontSize={10} tickLine={false} axisLine={false} unit="%" stroke="var(--chart-label)" />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="roi" radius={[4, 4, 0, 0]} fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
export default DashboardCharts;
