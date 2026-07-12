"use client";

import React, { useState, useTransition } from "react";
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { saveDriver, deleteDriver } from "@/actions/drivers";
import { toast } from "sonner";

interface Driver {
  _id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  safetyScore: number;
  status: "Available" | "On Trip" | "Off Duty" | "Suspended";
}

interface DriversClientProps {
  drivers: Driver[];
}

export function DriversClient({ drivers }: DriversClientProps) {
  const [isPending, startTransition] = useTransition();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form State
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCategory, setLicenseCategory] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [safetyScore, setSafetyScore] = useState("100");
  const [status, setStatus] = useState<"Available" | "On Trip" | "Off Duty" | "Suspended">("Available");

  const [formErrors, setFormErrors] = useState<any>({});

  // Filters
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setId("");
    setName("");
    setPhone("");
    setEmail("");
    setLicenseNumber("");
    setLicenseCategory("Class A CDL");
    setLicenseExpiry(new Date().toISOString().split("T")[0]);
    setSafetyScore("100");
    setStatus("Available");
    setFormErrors({});
    setIsOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setId(d._id);
    setName(d.name);
    setPhone(d.phone);
    setEmail(d.email);
    setLicenseNumber(d.licenseNumber);
    setLicenseCategory(d.licenseCategory);
    setLicenseExpiry(new Date(d.licenseExpiry).toISOString().split("T")[0]);
    setSafetyScore(d.safetyScore.toString());
    setStatus(d.status);
    setFormErrors({});
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData();
    if (id) formData.append("id", id);
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("licenseNumber", licenseNumber);
    formData.append("licenseCategory", licenseCategory);
    formData.append("licenseExpiry", licenseExpiry);
    formData.append("safetyScore", safetyScore);
    formData.append("status", status);

    startTransition(async () => {
      const res = await saveDriver(null, formData);
      if (res.success) {
        toast.success(editingDriver ? "Driver updated successfully!" : "Driver rostered successfully!");
        setIsOpen(false);
      } else if (res.error) {
        setFormErrors(res.error);
        toast.error("Please resolve form errors.");
      } else {
        toast.error(res.errorMessage || "Failed to save driver");
      }
    });
  };

  const handleDelete = async (driverId: string) => {
    if (confirm("Are you sure you want to remove this driver from the roster?")) {
      const res = await deleteDriver(driverId);
      if (res.success) {
        toast.success("Driver removed from roster.");
      } else {
        toast.error(res.error || "Failed to delete driver");
      }
    }
  };

  const isExpired = (expiryStr: string) => {
    return new Date(expiryStr) < new Date();
  };

  const getStatusBadge = (s: string, expiryStr: string) => {
    if (isExpired(expiryStr)) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400">
          <ShieldAlert className="h-3 w-3" /> License Expired
        </span>
      );
    }

    switch (s) {
      case "Available":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-250 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/30 dark:bg-emerald-950/20 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" /> Available
          </span>
        );
      case "On Trip":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:border-sky-850/30 dark:bg-sky-950/20 dark:text-sky-400">
            On Trip
          </span>
        );
      case "Off Duty":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-650 dark:border-zinc-750 dark:bg-zinc-800/30 dark:text-zinc-400">
            Off Duty
          </span>
        );
      case "Suspended":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400">
            <AlertTriangle className="h-3 w-3" /> Suspended
          </span>
        );
      default:
        return <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs">{s}</span>;
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 75) return "text-amber-600 dark:text-amber-400";
    return "text-red-650 dark:text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Driver Roster Registry
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage commercial drivers, license credentials compliance, and safety scores.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm hover:shadow-[0_2px_8px_-1px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <Plus className="h-4 w-4" /> Add Driver
        </button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-450" />
          <input
            type="text"
            placeholder="Search by name, license number, email..."
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
          <option value="All">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="Off Duty">Off Duty</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {/* Table view */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-sky-50/25 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <th className="px-6 py-3.5">Driver Name</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">License Number</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">License Expiry</th>
                <th className="px-6 py-3.5">Safety Score</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                    No drivers registered. Add a new driver to start.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((d) => {
                  const expired = isExpired(d.licenseExpiry);

                  return (
                    <tr
                      key={d._id}
                      className="hover:bg-sky-50/15 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                        {d.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-zinc-800 dark:text-zinc-200">{d.phone}</div>
                        <div className="text-xs text-zinc-500">{d.email}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-zinc-650 dark:text-zinc-400">
                        {d.licenseNumber}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-zinc-650 dark:text-zinc-400">
                        {d.licenseCategory}
                      </td>
                      <td
                        className={`whitespace-nowrap px-6 py-4 font-semibold ${
                          expired ? "text-red-650 dark:text-red-400" : "text-zinc-650 dark:text-zinc-400"
                        }`}
                      >
                        {new Date(d.licenseExpiry).toLocaleDateString([], {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`font-bold ${getSafetyScoreColor(d.safetyScore)}`}>
                          {d.safetyScore}/100
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {getStatusBadge(d.status, d.licenseExpiry)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(d)}
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-sky-50 hover:text-sky-600 dark:text-zinc-400 dark:hover:bg-sky-950/30 dark:hover:text-sky-400 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(d._id)}
                            className="rounded-lg p-1.5 text-red-650 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                {editingDriver ? "Edit Driver Details" : "Add Driver to Roster"}
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
                {/* Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Status */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-350"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Email */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@company.com"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                  {formErrors.email && (
                    <span className="text-xs text-red-650 mt-1 block">
                      {formErrors.email[0]}
                    </span>
                  )}
                </div>

                {/* License Number */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    License Number
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-NY883921"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                  {formErrors.licenseNumber && (
                    <span className="text-xs text-red-650 mt-1 block">
                      {formErrors.licenseNumber[0]}
                    </span>
                  )}
                </div>

                {/* License Category */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    License Class / Category
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value)}
                    placeholder="e.g. Class A CDL"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* License Expiry */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Safety Score */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Safety Score (0-100)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(e.target.value)}
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
                  {isPending ? "Saving..." : "Save Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default DriversClient;
