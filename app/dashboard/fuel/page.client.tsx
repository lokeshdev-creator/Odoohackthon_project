"use client";

import React, { useState, useTransition } from "react";
import { Plus, Search, Fuel, X, AlertCircle } from "lucide-react";
import { addFuelLog } from "@/actions/expenses";
import { toast } from "sonner";

interface Vehicle {
  _id: string;
  registrationNumber: string;
  name: string;
  odometer: number;
}

interface FuelLog {
  _id: string;
  vehicleId: Vehicle;
  liters: number;
  cost: number;
  odometer: number;
  date: string;
  createdAt: string;
}

interface FuelClientProps {
  logs: FuelLog[];
  vehicles: Vehicle[];
}

export function FuelClient({ logs, vehicles }: FuelClientProps) {
  const [isPending, startTransition] = useTransition();

  // Filters & Search
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [vehicleId, setVehicleId] = useState("");
  const [liters, setLiters] = useState("50");
  const [cost, setCost] = useState("60");
  const [odometer, setOdometer] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [formErrors, setFormErrors] = useState<any>({});

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.vehicleId?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      log.vehicleId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesVehicle = vehicleFilter === "All" || log.vehicleId?._id === vehicleFilter;
    return matchesSearch && matchesVehicle;
  });

  const handleOpenAdd = () => {
    const defaultVehicle = vehicles[0];
    setVehicleId(defaultVehicle?._id || "");
    setLiters("50");
    setCost("60");
    setOdometer(defaultVehicle?.odometer?.toString() || "0");
    setDate(new Date().toISOString().split("T")[0]);
    setFormErrors({});
    setIsOpen(true);
  };

  const handleVehicleChange = (id: string) => {
    setVehicleId(id);
    const selected = vehicles.find((v) => v._id === id);
    if (selected) {
      setOdometer(selected.odometer.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData();
    formData.append("vehicleId", vehicleId);
    formData.append("liters", liters);
    formData.append("cost", cost);
    formData.append("odometer", odometer);
    formData.append("date", date);

    startTransition(async () => {
      const res = await addFuelLog(null, formData);
      if (res.success) {
        toast.success("Fuel log registered! Operational expenses synced.");
        setIsOpen(false);
      } else if (res.error) {
        setFormErrors(res.error);
        toast.error("Please resolve form errors.");
      } else {
        toast.error(res.errorMessage || "Failed to register fuel log");
      }
    });
  };

  // Helper to calculate fuel efficiency: (Current Odometer - Previous Odometer) / Liters
  const calculateEfficiency = (currentLog: FuelLog) => {
    const vehicleLogs = logs
      .filter((l) => l.vehicleId?._id === currentLog.vehicleId?._id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const currentIndex = vehicleLogs.findIndex((l) => l._id === currentLog._id);
    if (currentIndex <= 0) {
      return "N/A"; // First refuel
    }

    const prevLog = vehicleLogs[currentIndex - 1];
    const diffDistance = currentLog.odometer - prevLog.odometer;

    if (diffDistance <= 0) return "0.00";
    return (diffDistance / currentLog.liters).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Fuel Refuel Registry
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Log fuel fill-ups, costs, liters, odometer milestones, and compute vehicle fuel efficiency.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm hover:shadow-[0_2px_8px_-1px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <Plus className="h-4 w-4" /> Register Fuel Log
        </button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-455" />
          <input
            type="text"
            placeholder="Search by vehicle registration or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-205 bg-zinc-50 py-2 pr-4 pl-9 text-sm text-zinc-900 placeholder-zinc-450 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-500 dark:focus:ring-sky-950/20"
          />
        </div>

        {/* Vehicle filter */}
        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-750 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-350 w-full sm:w-48 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        >
          <option value="All">All Vehicles</option>
          {vehicles.map((v) => (
            <option key={v._id} value={v._id}>
              {v.registrationNumber}
            </option>
          ))}
        </select>
      </div>

      {/* Table view */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-sky-50/25 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <th className="px-6 py-3.5">Refuel Date</th>
                <th className="px-6 py-3.5">Vehicle</th>
                <th className="px-6 py-3.5">Quantity (Liters)</th>
                <th className="px-6 py-3.5">Cost</th>
                <th className="px-6 py-3.5">Odometer at Refuel</th>
                <th className="px-6 py-3.5">Fuel Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No fuel logs registered.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-sky-50/15 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-200">
                      {new Date(log.date).toLocaleDateString([], {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {log.vehicleId ? (
                        <>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {log.vehicleId.registrationNumber}
                          </div>
                          <div className="text-xs text-zinc-500">{log.vehicleId.name}</div>
                        </>
                      ) : (
                        <span className="text-zinc-500">Retired Vehicle</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-650 dark:text-zinc-400">
                      {log.liters.toLocaleString()} Liters
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50">
                      ${log.cost.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-650 dark:text-zinc-400">
                      {log.odometer.toLocaleString()} km
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                        {calculateEfficiency(log)}{" "}
                        {calculateEfficiency(log) !== "N/A" ? "km / L" : ""}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Fuel Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Register Refuel Receipt
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-3">
                {/* Vehicle selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Select Vehicle
                  </label>
                  <select
                    value={vehicleId}
                    required
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-350"
                  >
                    {vehicles.length === 0 ? (
                      <option value="">No vehicles found</option>
                    ) : (
                      vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} ({v.name})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Liters */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Fuel Quantity (Liters)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Cost */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Total Refuel Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Odometer */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Odometer reading (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                  {formErrors.odometer && (
                    <span className="text-xs text-red-650 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {formErrors.odometer[0]}
                    </span>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-sky-50/20 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-350 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 disabled:opacity-50 transition-all"
                >
                  {isPending ? "Logging..." : "Log fuel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default FuelClient;
