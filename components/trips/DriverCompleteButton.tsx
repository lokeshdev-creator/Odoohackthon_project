"use client";

import React, { useState, useTransition } from "react";
import { completeTrip } from "@/actions/trips";
import { toast } from "sonner";
import { X } from "lucide-react";

export function DriverCompleteButton({ trip }: { trip: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [actualDistance, setActualDistance] = useState(trip.plannedDistance.toString());
  const [fuelConsumed, setFuelConsumed] = useState("");
  const [fuelCost, setFuelCost] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const res = await completeTrip(
          trip._id,
          parseFloat(actualDistance),
          parseFloat(fuelConsumed || "0"),
          parseFloat(fuelCost || "0")
        );
        if (res.success) {
          toast.success("Trip completed successfully!");
          setIsOpen(false);
          window.location.reload();
        } else {
          toast.error(res.error || "Failed to complete trip");
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
        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow transition-all cursor-pointer focus:outline-none"
      >
        Complete Active Trip
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Log Trip Completion Details
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Actual Distance Traveled (km)
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Fuel Consumed (Liters)
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  placeholder="e.g. 45.5"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Fuel Cost ($)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="e.g. 68.25"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
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
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isPending ? "Submitting..." : "Submit Completion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
