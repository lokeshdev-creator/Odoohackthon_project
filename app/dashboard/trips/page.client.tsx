"use client";

import React, { useState, useTransition } from "react";
import { Plus, Search, Edit2, Play, CheckSquare, XCircle, X, AlertTriangle, ArrowRight } from "lucide-react";
import { saveTrip, dispatchTrip, completeTrip, cancelTrip } from "@/actions/trips";
import { toast } from "sonner";

interface Vehicle {
  _id: string;
  registrationNumber: string;
  name: string;
  capacity: number;
}

interface Driver {
  _id: string;
  name: string;
  licenseExpiry: string;
}

interface Trip {
  _id: string;
  source: string;
  destination: string;
  vehicleId: Vehicle;
  driverId: Driver;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance?: number;
  fuelConsumed?: number;
  revenue: number;
  status: "Draft" | "Dispatched" | "Completed" | "Cancelled";
  dispatchDate?: string;
  completionDate?: string;
  createdAt: string;
}

interface TripsClientProps {
  trips: Trip[];
  availableVehicles: Vehicle[];
  availableDrivers: Driver[];
  isDriver?: boolean;
}

export function TripsClient({ trips, availableVehicles, availableDrivers, isDriver = false }: TripsClientProps) {
  const [isPending, startTransition] = useTransition();

  // Filter & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Create/Edit Trip Modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Form Fields
  const [id, setId] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [plannedDistance, setPlannedDistance] = useState("");
  const [revenue, setRevenue] = useState("");

  // Complete Trip Modal
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [completingTripId, setCompletingTripId] = useState("");
  const [actualDistance, setActualDistance] = useState("");
  const [fuelConsumed, setFuelConsumed] = useState("");
  const [fuelCost, setFuelCost] = useState("");

  const [formErrors, setFormErrors] = useState<any>({});

  // Filter list
  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.source.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase()) ||
      t.vehicleId?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      t.driverId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate capacity warning
  const selectedVehicleObj = [...availableVehicles, ...(editingTrip ? [editingTrip.vehicleId] : [])].find(
    (v) => v?._id === vehicleId
  );
  const isOverweight = selectedVehicleObj && Number(cargoWeight) > selectedVehicleObj.capacity;

  const handleOpenAdd = () => {
    setEditingTrip(null);
    setId("");
    setSource("");
    setDestination("");
    setVehicleId(availableVehicles[0]?._id || "");
    setDriverId(availableDrivers[0]?._id || "");
    setCargoWeight("1000");
    setPlannedDistance("500");
    setRevenue("1500");
    setFormErrors({});
    setIsOpen(true);
  };

  const handleOpenEdit = (t: Trip) => {
    setEditingTrip(t);
    setId(t._id);
    setSource(t.source);
    setDestination(t.destination);
    setVehicleId(t.vehicleId?._id || "");
    setDriverId(t.driverId?._id || "");
    setCargoWeight(t.cargoWeight.toString());
    setPlannedDistance(t.plannedDistance.toString());
    setRevenue(t.revenue.toString());
    setFormErrors({});
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (isOverweight) {
      toast.error("Cargo weight exceeds vehicle capacity!");
      return;
    }

    const formData = new FormData();
    if (id) formData.append("id", id);
    formData.append("source", source);
    formData.append("destination", destination);
    formData.append("vehicleId", vehicleId);
    formData.append("driverId", driverId);
    formData.append("cargoWeight", cargoWeight);
    formData.append("plannedDistance", plannedDistance);
    formData.append("revenue", revenue);
    formData.append("status", editingTrip?.status || "Draft");

    startTransition(async () => {
      const res = await saveTrip(null, formData);
      if (res.success) {
        toast.success(editingTrip ? "Trip updated successfully!" : "Trip created successfully!");
        setIsOpen(false);
      } else if (res.error) {
        setFormErrors(res.error);
        toast.error("Please correct the form errors.");
      } else {
        toast.error(res.errorMessage || "Failed to save trip");
      }
    });
  };

  const handleDispatch = async (tripId: string) => {
    if (confirm("Are you sure you want to dispatch this trip? Driver and vehicle status will become 'On Trip'.")) {
      const res = await dispatchTrip(tripId);
      if (res.success) {
        toast.success("Trip dispatched successfully!");
      } else {
        toast.error(res.error || "Failed to dispatch trip");
      }
    }
  };

  const handleOpenComplete = (tripId: string, plannedDist: number) => {
    setCompletingTripId(tripId);
    setActualDistance(plannedDist.toString());
    setFuelConsumed("100");
    setFuelCost("120");
    setIsCompleteOpen(true);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualDistance || !fuelConsumed || !fuelCost) {
      toast.error("Please enter all completions details.");
      return;
    }

    startTransition(async () => {
      const res = await completeTrip(
        completingTripId,
        Number(actualDistance),
        Number(fuelConsumed),
        Number(fuelCost)
      );
      if (res.success) {
        toast.success("Trip marked as Completed! Expenses and fuel logged.");
        setIsCompleteOpen(false);
      } else {
        toast.error(res.error || "Failed to complete trip");
      }
    });
  };

  const handleCancel = async (tripId: string) => {
    if (confirm("Are you sure you want to cancel this trip? Assigned resources will return to 'Available'.")) {
      const res = await cancelTrip(tripId);
      if (res.success) {
        toast.success("Trip cancelled successfully!");
      } else {
        toast.error(res.error || "Failed to cancel trip");
      }
    }
  };

  // Compile specific vehicle selection array
  const vehiclesPool = [...availableVehicles];
  if (editingTrip && !vehiclesPool.some((v) => v._id === editingTrip.vehicleId?._id)) {
    if (editingTrip.vehicleId) vehiclesPool.push(editingTrip.vehicleId);
  }

  // Compile specific driver selection array
  const driversPool = [...availableDrivers];
  if (editingTrip && !driversPool.some((d) => d._id === editingTrip.driverId?._id)) {
    if (editingTrip.driverId) driversPool.push(editingTrip.driverId);
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Draft":
        return "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800/20 dark:text-zinc-400 dark:border-zinc-700/30";
      case "Dispatched":
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-300 dark:border-sky-800/30";
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30";
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Trip & Dispatch Log
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Create drafts, dispatch shipments, record completions, and log distance/fuel metrics.
          </p>
        </div>
        {!isDriver && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm hover:shadow-[0_2px_8px_-1px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <Plus className="h-4 w-4" /> Create Trip Draft
          </button>
        )}
      </div>

      {/* Filter Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search trips by route, vehicle, driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pr-4 pl-9 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-500 dark:focus:ring-sky-950/20"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 w-full sm:w-48 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Dispatched">Dispatched</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table view */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-sky-50/25 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <th className="px-6 py-3.5">Route</th>
                <th className="px-6 py-3.5">Vehicle</th>
                <th className="px-6 py-3.5">Driver</th>
                <th className="px-6 py-3.5">Cargo / Distance</th>
                <th className="px-6 py-3.5">Revenue</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No trips logged. Create a new trip draft to begin.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((t) => (
                  <tr
                    key={t._id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-200">
                      <div className="flex items-center gap-1">
                        <span>{t.source}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{t.destination}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Created: {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {t.vehicleId ? (
                        <>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {t.vehicleId.registrationNumber}
                          </div>
                          <div className="text-xs text-zinc-500">{t.vehicleId.name}</div>
                        </>
                      ) : (
                        <span className="text-red-500">Unassigned</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {t.driverId?.name || <span className="text-red-500">Unassigned</span>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      <div>Weight: {t.cargoWeight.toLocaleString()} kg</div>
                      <div className="text-xs text-zinc-500">Dist: {t.plannedDistance.toLocaleString()} km</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50">
                      ${t.revenue.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {t.status === "Draft" && (
                          <>
                            <button
                              onClick={() => handleDispatch(t._id)}
                              className="flex items-center gap-1 rounded bg-zinc-950 px-2 py-1 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                              title="Dispatch Trip"
                            >
                              <Play className="h-3 w-3" /> Dispatch
                            </button>
                            {!isDriver && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(t)}
                                  className="rounded border border-zinc-200 p-1 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                                  title="Edit"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleCancel(t._id)}
                                  className="rounded border border-red-200 p-1 text-red-600 hover:bg-red-50 dark:border-red-950/20"
                                  title="Cancel Draft"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                        {t.status === "Dispatched" && (
                          <>
                            <button
                              onClick={() => handleOpenComplete(t._id, t.plannedDistance)}
                              className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                              title="Complete Trip"
                            >
                              <CheckSquare className="h-3 w-3" /> Complete
                            </button>
                            {!isDriver && (
                              <button
                                onClick={() => handleCancel(t._id)}
                                className="rounded border border-red-200 p-1 text-red-600 hover:bg-red-50 dark:border-red-950/20"
                                title="Cancel Dispatched"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {editingTrip ? "Edit Trip Draft" : "Create Trip Draft"}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Source */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Source location
                  </label>
                  <input
                    type="text"
                    required
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Seattle, WA"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Destination */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Final destination
                  </label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Portland, OR"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Vehicle Selection */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Assign Available Vehicle
                  </label>
                  <select
                    value={vehicleId}
                    required
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    {vehiclesPool.length === 0 ? (
                      <option value="">No available vehicles</option>
                    ) : (
                      vehiclesPool.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} ({v.name} - Cap: {v.capacity} kg)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Driver Selection */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Assign Available Driver
                  </label>
                  <select
                    value={driverId}
                    required
                    onChange={(e) => setDriverId(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    {driversPool.length === 0 ? (
                      <option value="">No available drivers</option>
                    ) : (
                      driversPool.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Cargo weight */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Cargo Weight (kg)
                  </label>
                  <input
                    type="number"
                    required
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                  {isOverweight && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center mt-1">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Warning: Weight exceeds vehicle capacity ({selectedVehicleObj?.capacity} kg)
                    </span>
                  )}
                </div>

                {/* Planned Distance */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Planned Distance (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={plannedDistance}
                    onChange={(e) => setPlannedDistance(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Expected Revenue */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Expected Revenue ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-sky-50/20 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-355 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || isOverweight}
                  className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 disabled:opacity-50 transition-all"
                >
                  {isPending ? "Saving..." : "Save Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Details Modal Dialog */}
      {isCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Record Trip Completion
              </h3>
              <button
                onClick={() => setIsCompleteOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="mt-4 space-y-4">
              <div className="space-y-3">
                {/* Actual Distance */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Actual Distance Travelled (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={actualDistance}
                    onChange={(e) => setActualDistance(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Fuel Consumed */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Fuel Consumed (Liters)
                  </label>
                  <input
                    type="number"
                    required
                    value={fuelConsumed}
                    onChange={(e) => setFuelConsumed(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Fuel Cost */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Total Fuel Cost ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCompleteOpen(false)}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-sky-50/20 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-50 transition-all"
                >
                  {isPending ? "Completing..." : "Complete & Log Fuel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default TripsClient;
