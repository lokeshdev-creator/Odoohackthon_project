"use client";

import React, { useState, useTransition } from "react";
import { Plus, Search, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import { saveVehicle, deleteVehicle } from "@/actions/vehicles";
import { toast } from "sonner";

interface Vehicle {
  _id: string;
  registrationNumber: string;
  name: string;
  model: string;
  type: string;
  capacity: number;
  odometer: number;
  acquisitionCost: number;
  purchaseDate: string;
  status: "Available" | "On Trip" | "In Shop" | "Retired";
  region?: string;
  documents?: Array<{
    name: string;
    url: string;
    uploadedAt: string;
  }>;
}

interface VehiclesClientProps {
  vehicles: Vehicle[];
}

export function VehiclesClient({ vehicles }: VehiclesClientProps) {
  const [isPending, startTransition] = useTransition();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");

  // Modal Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form Fields State
  const [id, setId] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [odometer, setOdometer] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [status, setStatus] = useState<"Available" | "On Trip" | "In Shop" | "Retired">("Available");
  const [region, setRegion] = useState("North");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [formErrors, setFormErrors] = useState<any>({});

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    const matchesType = typeFilter === "All" || v.type === typeFilter;
    const matchesRegion = regionFilter === "All" || v.region === regionFilter;
    return matchesSearch && matchesStatus && matchesType && matchesRegion;
  });

  // Extract unique types for type filter
  const vehicleTypes = ["All", ...Array.from(new Set(vehicles.map((v) => v.type)))];

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setId("");
    setRegistrationNumber("");
    setName("");
    setModel("");
    setType("Truck");
    setCapacity("5000");
    setOdometer("0");
    setAcquisitionCost("30000");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setStatus("Available");
    setRegion("North");
    setFormErrors({});
    setIsOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setId(v._id);
    setRegistrationNumber(v.registrationNumber);
    setName(v.name);
    setModel(v.model);
    setType(v.type);
    setCapacity(v.capacity.toString());
    setOdometer(v.odometer.toString());
    setAcquisitionCost(v.acquisitionCost.toString());
    setPurchaseDate(new Date(v.purchaseDate).toISOString().split("T")[0]);
    setStatus(v.status);
    setRegion(v.region || "North");
    setFormErrors({});
    setIsOpen(true);
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingVehicle) return;

    setUploadingDoc(true);
    const file = files[0];
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("vehicleId", editingVehicle._id);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Document uploaded successfully!");
        if (editingVehicle.documents) {
          editingVehicle.documents.push(result.document);
        } else {
          editingVehicle.documents = [result.document];
        }
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to upload document");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during upload");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docUrl: string) => {
    if (!editingVehicle) return;
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const { deleteVehicleDocument } = await import("@/actions/vehicles");
      const res = await deleteVehicleDocument(editingVehicle._id, docUrl);
      if (res.success) {
        toast.success("Document deleted!");
        if (editingVehicle.documents) {
          editingVehicle.documents = editingVehicle.documents.filter(d => d.url !== docUrl);
        }
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to delete document");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData();
    if (id) formData.append("id", id);
    formData.append("registrationNumber", registrationNumber);
    formData.append("name", name);
    formData.append("model", model);
    formData.append("type", type);
    formData.append("capacity", capacity);
    formData.append("odometer", odometer);
    formData.append("acquisitionCost", acquisitionCost);
    formData.append("purchaseDate", purchaseDate);
    formData.append("status", status);
    formData.append("region", region);

    startTransition(async () => {
      const res = await saveVehicle(null, formData);
      if (res.success) {
        toast.success(editingVehicle ? "Vehicle updated successfully!" : "Vehicle registered successfully!");
        setIsOpen(false);
      } else if (res.error) {
        setFormErrors(res.error);
        toast.error("Please correct the form errors.");
      } else {
        toast.error(res.errorMessage || "Failed to save vehicle");
      }
    });
  };

  const handleDelete = async (vehicleId: string) => {
    if (confirm("Are you sure you want to retire and remove this vehicle?")) {
      const res = await deleteVehicle(vehicleId);
      if (res.success) {
        toast.success("Vehicle deleted successfully!");
      } else {
        toast.error(res.error || "Failed to delete vehicle");
      }
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "Available":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30";
      case "On Trip":
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-800/30";
      case "In Shop":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30";
      case "Retired":
        return "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/20 dark:text-zinc-400 dark:border-zinc-700/30";
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
            Vehicle Fleet Registry
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage your cargo haulers, box trucks, trailers, and utility vans.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm hover:shadow-[0_2px_8px_-1px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <Plus className="h-4 w-4" /> Register Vehicle
        </button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by reg number, name, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pr-4 pl-9 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-500 dark:focus:ring-sky-950/20"
          />
        </div>

        {/* Status filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All Types" : type}
              </option>
            ))}
          </select>

          {/* Region filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="All">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="Central">Central</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-sky-50/25 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <th className="px-6 py-3.5">Reg Number</th>
                <th className="px-6 py-3.5">Name / Model</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Region</th>
                <th className="px-6 py-3.5">Capacity (kg)</th>
                <th className="px-6 py-3.5">Odometer (km)</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No vehicles found. Try adjusting filters or register a new vehicle.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr
                    key={v._id}
                    className="hover:bg-sky-50/15 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {v.registrationNumber}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {v.name}
                      </div>
                      <div className="text-xs text-zinc-500">{v.model}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {v.type}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {v.region || "North"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {v.capacity.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {v.odometer.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(
                          v.status
                        )}`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(v._id)}
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                          title="Retire/Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                {editingVehicle ? "Edit Vehicle Details" : "Register New Vehicle"}
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
                {/* Registration Number */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. CA-4491-TX"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                  {formErrors.registrationNumber && (
                    <span className="text-xs text-red-600 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {formErrors.registrationNumber[0]}
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Vehicle Status
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                {/* Region */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="Central">Central</option>
                  </select>
                </div>

                {/* Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Vehicle Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ford Transit"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Model */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Sprinter 2500"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Type */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Vehicle Type
                  </label>
                  <input
                    type="text"
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="e.g. Box Truck"
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Max Load Capacity */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Max Load Capacity (kg)
                  </label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Odometer */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Acquisition Cost */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Acquisition Cost ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Purchase Date */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {/* Documents Upload Section (Only when editing) */}
                {editingVehicle && (
                  <div className="col-span-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      Vehicle Documents
                    </span>
                    <div className="space-y-2">
                      {editingVehicle.documents && editingVehicle.documents.length > 0 ? (
                        <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-100 p-2 dark:divide-zinc-800 dark:border-zinc-800">
                          {editingVehicle.documents.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1.5 text-xs">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 hover:underline dark:text-sky-400 truncate max-w-[200px]"
                              >
                                📄 {doc.name}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.url)}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">No documents attached.</p>
                      )}

                      <div className="mt-2">
                        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-sky-50/20 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all">
                          {uploadingDoc ? "Uploading..." : "Attach Document"}
                          <input
                            type="file"
                            disabled={uploadingDoc}
                            onChange={handleUploadDocument}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
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
                  {isPending ? "Saving..." : "Save Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default VehiclesClient;
