"use client";

import React, { useState, useTransition, useEffect } from "react";
import { logDriverFuel } from "@/actions/fuel";
import { toast } from "sonner";
import { X, Fuel } from "lucide-react";

interface Vehicle {
  _id: string;
  registrationNumber: string;
  name: string;
  odometer: number;
}

interface DriverFuelModalProps {
  activeTrip: any | null;
  vehicles: Vehicle[];
}

export function DriverFuelModal({ activeTrip, vehicles }: DriverFuelModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [liters, setLiters] = useState("");
  const [cost, setCost] = useState("");
  const [odometer, setOdometer] = useState("");

  // Determine which vehicle is active and set state defaults
  useEffect(() => {
    if (activeTrip && activeTrip.vehicleId) {
      setSelectedVehicleId(activeTrip.vehicleId._id);
      setOdometer(activeTrip.vehicleId.odometer?.toString() || "0");
    } else if (vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0]._id);
      setOdometer(vehicles[0].odometer?.toString() || "0");
    }
  }, [activeTrip, vehicles]);

  // Update odometer fallback when selected vehicle changes in dropdown
  const handleVehicleChange = (val: string) => {
    setSelectedVehicleId(val);
    const vehicle = vehicles.find((v) => v._id === val);
    if (vehicle) {
      setOdometer(vehicle.odometer?.toString() || "0");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicleId || !liters || !cost || !odometer) {
      toast.error("Please fill in all fuel details.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await logDriverFuel(
          selectedVehicleId,
          parseFloat(liters),
          parseFloat(cost),
          parseInt(odometer)
        );

        if (res.success) {
          toast.success("Fuel log and expense logged successfully!");
          setIsOpen(false);
          // Reset form fields
          setLiters("");
          setCost("");
          window.location.reload();
        } else {
          toast.error(res.error || "Failed to log fuel");
        }
      } catch (err: any) {
        toast.error(err.message || "An error occurred");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-sky-50/20 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer focus:outline-none"
      >
        <Fuel className="h-4 w-4" /> Log Fuel Purchase
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Log Fuel Refill
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left">
              {/* Vehicle Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Select Vehicle
                </label>
                {activeTrip ? (
                  <input
                    type="text"
                    disabled
                    value={`${activeTrip.vehicleId.name} (${activeTrip.vehicleId.registrationNumber})`}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3.5 py-2 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                  />
                ) : (
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.registrationNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Liters */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Liters Filled
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  placeholder="e.g. 45.5"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Cost */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Total Cost ($)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="e.g. 65.50"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Current Odometer */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Current Odometer Reading (km)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 124500"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-sky-50/20 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isPending ? "Logging..." : "Log Refill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
