"use client";

import React, { useState, useTransition } from "react";
import { Plus, Search, DollarSign, X } from "lucide-react";
import { addExpense } from "@/actions/expenses";
import { toast } from "sonner";

interface Vehicle {
  _id: string;
  registrationNumber: string;
  name: string;
}

interface Expense {
  _id: string;
  vehicleId: Vehicle;
  category: "Fuel" | "Maintenance" | "Toll" | "Repair" | "Insurance" | "Other";
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

interface ExpensesClientProps {
  expenses: Expense[];
  vehicles: Vehicle[];
}

export function ExpensesClient({ expenses, vehicles }: ExpensesClientProps) {
  const [isPending, startTransition] = useTransition();

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [vehicleFilter, setVehicleFilter] = useState("All");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [vehicleId, setVehicleId] = useState("");
  const [category, setCategory] = useState<"Fuel" | "Maintenance" | "Toll" | "Repair" | "Insurance" | "Other">("Other");
  const [amount, setAmount] = useState("50");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [formErrors, setFormErrors] = useState<any>({});

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.vehicleId?.registrationNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || e.category === categoryFilter;
    const matchesVehicle = vehicleFilter === "All" || e.vehicleId?._id === vehicleFilter;
    return matchesSearch && matchesCategory && matchesVehicle;
  });

  const handleOpenAdd = () => {
    setVehicleId(vehicles[0]?._id || "");
    setCategory("Other");
    setAmount("50");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setFormErrors({});
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData();
    formData.append("vehicleId", vehicleId);
    formData.append("category", category);
    formData.append("amount", amount);
    formData.append("description", description);
    formData.append("date", date);

    startTransition(async () => {
      const res = await addExpense(null, formData);
      if (res.success) {
        toast.success("Expense logged successfully!");
        setIsOpen(false);
      } else if (res.error) {
        setFormErrors(res.error);
        toast.error("Please resolve form errors.");
      } else {
        toast.error(res.errorMessage || "Failed to log expense");
      }
    });
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "Fuel":
        return "bg-amber-50 text-amber-705 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400";
      case "Maintenance":
        return "bg-blue-50 text-blue-700 border-blue-250 dark:bg-blue-950/20 dark:text-blue-400";
      case "Toll":
        return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200";
      case "Repair":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400";
      case "Insurance":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950/20 dark:text-zinc-400";
    }
  };

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Control */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Operating Expenses Ledger
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Monitor and record fleet cash flows, tolls, maintenance costs, and fuel receipts.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm hover:shadow-[0_2px_8px_-1px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <Plus className="h-4 w-4" /> Log Expense Receipt
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Total expenses in current search scope
          </span>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            ${totalFilteredAmount.toLocaleString()} USD
          </span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by description or vehicle registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pr-4 pl-9 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-500 dark:focus:ring-sky-950/20"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="All">All Categories</option>
            <option value="Fuel">Fuel</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Toll">Toll</option>
            <option value="Repair">Repair</option>
            <option value="Insurance">Insurance</option>
            <option value="Other">Other</option>
          </select>

          {/* Vehicle filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="All">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.registrationNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-sky-50/25 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <th className="px-6 py-3.5">Expense Date</th>
                <th className="px-6 py-3.5">Vehicle</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr
                    key={exp._id}
                    className="hover:bg-sky-50/15 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-200">
                      {new Date(exp.date).toLocaleDateString([], {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {exp.vehicleId ? (
                        <>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {exp.vehicleId.registrationNumber}
                          </div>
                          <div className="text-xs text-zinc-500">{exp.vehicleId.name}</div>
                        </>
                      ) : (
                        <span className="text-zinc-500 font-sans text-xs">Retired Vehicle</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getCategoryBadgeClass(
                          exp.category
                        )}`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{exp.description}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50">
                      ${exp.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Log Expense Receipt
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
                {/* Vehicle Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Select Vehicle
                  </label>
                  <select
                    value={vehicleId}
                    required
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    {vehicles.length === 0 ? (
                      <option value="">No vehicles registered</option>
                    ) : (
                      vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} ({v.name})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    <option value="Fuel">Fuel (Auto Refuels should be logged via Fuel Logs)</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Toll">Toll</option>
                    <option value="Repair">Repair</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
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

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Receipt Details / Remarks
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Turnpipe Toll Charge Seattle to Portland"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
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
                  className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 disabled:opacity-50 transition-all"
                >
                  {isPending ? "Logging..." : "Log Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ExpensesClient;
