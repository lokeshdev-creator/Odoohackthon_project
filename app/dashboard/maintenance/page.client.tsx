"use client";

import React, { useState, useTransition } from "react";
import { Plus, Search, CheckSquare, X, ShieldAlert, AlertCircle } from "lucide-react";
import { createMaintenance, closeMaintenance } from "@/actions/maintenance";
import { toast } from "sonner";

interface Vehicle {
  _id: string;
  registrationNumber: string;
  name: string;
  status: string;
}

interface MaintenanceLog {
  _id: string;
  vehicleId: Vehicle;
  type: string;
  description: string;
  cost: number;
  startDate: string;
  endDate: string;
  status: "Open" | "Closed";
  createdAt: string;
}

interface MaintenanceClientProps {
  logs: MaintenanceLog[];
  vehicles: Vehicle[];
}

export function MaintenanceClient({ logs, vehicles }: MaintenanceClientProps) {
  const [isPending, startTransition] = useTransition();

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState("Oil Change");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("150");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const [formErrors, setFormErrors] = useState<any>({});

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.type.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.vehicleId?.registrationNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setVehicleId(vehicles.filter((v) => v.status === "Available")[0]?._id || "");
    setType("Oil Change");
    setDescription("");
    setCost("150");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setFormErrors({});
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData();
    formData.append("vehicleId", vehicleId);
    formData.append("type", type);
    formData.append("description", description);
    formData.append("cost", cost);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);

    startTransition(async () => {
      const res = await createMaintenance(null, formData);
      if (res.success) {
        toast.success("Maintenance log created! Vehicle status is now 'In Shop'.");
        setIsOpen(false);
      } else if (res.error) {
        setFormErrors(res.error);
        toast.error("Please correct the form errors.");
      } else {
        toast.error(res.errorMessage || "Failed to create maintenance log");
      }
    });
  };

  const handleCloseMaintenance = async (logId: string) => {
    if (
      confirm(
        "Are you sure you want to close this maintenance ticket? Cost will be logged as an operating expense, and vehicle will return to 'Available' status."
      )
    ) {
      startTransition(async () => {
        const res = await closeMaintenance(logId);
        if (res.success) {
          toast.success("Maintenance completed! Vehicle returned to Available.");
        } else {
          toast.error(res.error || "Failed to close maintenance ticket");
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Maintenance Roster & Shop Tickers
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Track repairs, schedule service logs, and automatically place vehicles in shop (locking from dispatch).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm hover:shadow-[0_2px_8px_-1px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <Plus className="h-4 w-4" /> Schedule Service
        </button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-450" />
          <input
            type="text"
            placeholder="Search by vehicle registration, type, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-205 bg-zinc-50 py-2 pr-4 pl-9 text-sm text-zinc-900 placeholder-zinc-450 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-500 dark:focus:ring-sky-950/20"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-750 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-350 w-full sm:w-48 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        >
          <option value="All">All Tickets</option>
          <option value="Open">Open (In Shop)</option>
          <option value="Closed">Closed (Completed)</option>
        </select>
      </div>

      {/* Table view */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-sky-50/25 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <th className="px-6 py-3.5">Vehicle</th>
                <th className="px-6 py-3.5">Service Type</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Cost</th>
                <th className="px-6 py-3.5">Schedule</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Shop Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No maintenance records logged.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-sky-50/15 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      {log.vehicleId ? (
                        <>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {log.vehicleId.registrationNumber}
                          </div>
                          <div className="text-xs text-zinc-500">{log.vehicleId.name}</div>
                        </>
                      ) : (
                        <span className="text-red-550">Retired Vehicle</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-200">
                      {log.type}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs truncate text-zinc-650 dark:text-zinc-400">
                      {log.description}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50">
                      ${log.cost.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-zinc-550 dark:text-zinc-400">
                      <div>Start: {new Date(log.startDate).toLocaleDateString()}</div>
                      <div>End: {new Date(log.endDate).toLocaleDateString()}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          log.status === "Open"
                            ? "bg-amber-50 text-amber-705 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400"
                            : "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400"
                        }`}
                      >
                        {log.status === "Open" ? "In Shop (Open)" : "Closed"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {log.status === "Open" && (
                        <button
                          onClick={() => handleCloseMaintenance(log._id)}
                          className="inline-flex items-center gap-1 rounded bg-emerald-605 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                          title="Complete maintenance"
                        >
                          <CheckSquare className="h-3 w-3" /> Close Ticket
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Service Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Schedule Service Ticket
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
                {/* Vehicle */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Select Vehicle
                  </label>
                  <select
                    value={vehicleId}
                    required
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-350"
                  >
                    {vehicles.filter((v) => v.status === "Available").length === 0 ? (
                      <option value="">No available vehicles for shop service</option>
                    ) : (
                      vehicles
                        .filter((v) => v.status === "Available")
                        .map((v) => (
                          <option key={v._id} value={v._id}>
                            {v.registrationNumber} ({v.name})
                          </option>
                        ))
                    )}
                  </select>
                  {formErrors.vehicleId && (
                    <span className="text-xs text-red-650 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {formErrors.vehicleId[0]}
                    </span>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Service Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-350"
                  >
                    <option value="Oil Change">Oil Change</option>
                    <option value="Brake Inspection">Brake Inspection</option>
                    <option value="Tire Rotation">Tire Rotation</option>
                    <option value="Engine Repair">Engine Repair</option>
                    <option value="Toll System Check">Toll System Check</option>
                    <option value="Other Diagnostics">Other Diagnostics</option>
                  </select>
                </div>

                {/* Cost */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Estimated Cost ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Detailed Diagnostics / Remarks
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe parts replaced or service scope..."
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 resize-none"
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
                  {isPending ? "Scheduling..." : "Book Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default MaintenanceClient;
