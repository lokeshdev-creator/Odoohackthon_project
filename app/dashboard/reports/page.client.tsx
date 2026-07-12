"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, Table } from "lucide-react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

interface Vehicle {
  _id: string;
  registrationNumber: string;
  name: string;
  type: string;
  status: string;
  acquisitionCost: number;
}

interface Trip {
  _id: string;
  source: string;
  destination: string;
  vehicleId: Vehicle;
  actualDistance?: number;
  fuelConsumed?: number;
  revenue: number;
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
  status: string;
}

interface Expense {
  _id: string;
  vehicleId: string;
  category: string;
  amount: number;
  date: string;
}

interface ReportsClientProps {
  vehicles: Vehicle[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  expenses: Expense[];
}

type ReportType = "utilization" | "roi" | "efficiency" | "maintenance";

export function ReportsClient({ vehicles, trips, maintenance, expenses }: ReportsClientProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>("utilization");

  // 1. Compile Fleet Utilization Report Data
  const getUtilizationData = () => {
    return vehicles.map((v) => {
      const completedTripsCount = trips.filter((t) => t.vehicleId?._id === v._id).length;
      return {
        "Registration Number": v.registrationNumber,
        "Vehicle Name": v.name,
        Type: v.type,
        Status: v.status,
        "Completed Trips": completedTripsCount,
      };
    });
  };

  // 2. Compile ROI Report Data
  const getRoiData = () => {
    return vehicles.map((v) => {
      const vTrips = trips.filter((t) => t.vehicleId?._id === v._id);
      const revenue = vTrips.reduce((acc, t) => acc + t.revenue, 0);

      const vMaint = expenses.filter((e) => e.vehicleId === v._id && e.category === "Maintenance");
      const maintCost = vMaint.reduce((acc, e) => acc + e.amount, 0);

      const vFuel = expenses.filter((e) => e.vehicleId === v._id && e.category === "Fuel");
      const fuelCost = vFuel.reduce((acc, e) => acc + e.amount, 0);

      const netProfit = revenue - (maintCost + fuelCost);
      const roi = v.acquisitionCost > 0 ? (netProfit / v.acquisitionCost) * 100 : 0;

      return {
        "Registration Number": v.registrationNumber,
        "Vehicle Name": v.name,
        "Revenue ($)": revenue,
        "Maintenance Cost ($)": maintCost,
        "Fuel Cost ($)": fuelCost,
        "Net Profit ($)": netProfit,
        "ROI (%)": Math.round(roi),
      };
    });
  };

  // 3. Compile Fuel Efficiency Report Data
  const getFuelData = () => {
    return vehicles.map((v) => {
      const vTrips = trips.filter((t) => t.vehicleId?._id === v._id);
      const distance = vTrips.reduce((acc, t) => acc + (t.actualDistance || 0), 0);
      const liters = vTrips.reduce((acc, t) => acc + (t.fuelConsumed || 0), 0);
      const efficiency = liters > 0 ? (distance / liters).toFixed(2) : "0.00";

      return {
        "Registration Number": v.registrationNumber,
        "Vehicle Name": v.name,
        "Total Distance (km)": distance,
        "Total Fuel (Liters)": liters,
        "Efficiency (km/L)": efficiency,
      };
    });
  };

  // 4. Compile Maintenance Report Data
  const getMaintenanceData = () => {
    return maintenance.map((m) => ({
      Vehicle: m.vehicleId?.registrationNumber || "Retired",
      "Service Type": m.type,
      Cost: m.cost,
      "Start Date": new Date(m.startDate).toLocaleDateString(),
      "End Date": new Date(m.endDate).toLocaleDateString(),
      Status: m.status,
    }));
  };

  const getReportPayload = (): any[] => {
    switch (selectedReport) {
      case "utilization":
        return getUtilizationData();
      case "roi":
        return getRoiData();
      case "efficiency":
        return getFuelData();
      case "maintenance":
        return getMaintenanceData();
    }
  };

  const headers = getReportPayload()[0] ? Object.keys(getReportPayload()[0]) : [];
  const rows = getReportPayload();

  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.error("No data available to export");
      return;
    }
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transitops_${selectedReport}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully!");
  };

  const handleExportPDF = () => {
    if (rows.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`TransitOps Fleet Report - ${selectedReport.toUpperCase()}`, 14, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 22);

      let y = 35;
      doc.setFont("helvetica", "bold");

      // Calculate column widths
      const colWidth = 180 / headers.length;

      // Draw table headers
      headers.forEach((h, i) => {
        doc.text(h, 14 + i * colWidth, y);
      });
      doc.line(14, y + 2, 196, y + 2);
      y += 8;

      // Draw table rows
      doc.setFont("helvetica", "normal");
      rows.forEach((row) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        headers.forEach((headerKey, i) => {
          const val = String(row[headerKey]);
          doc.text(val, 14 + i * colWidth, y);
        });
        y += 6;
      });

      doc.save(`transitops_${selectedReport}_report.pdf`);
      toast.success("PDF file downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF document.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
          Fleet Reports & Exports
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Generate operational cost metrics, fuel efficiency logs, vehicle ROI sheets, and export as CSV or PDF.
        </p>
      </div>

      {/* Tabs selectors */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Left Side Tab Links */}
        <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setSelectedReport("utilization")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all ${
              selectedReport === "utilization"
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300"
                : "text-zinc-600 hover:bg-sky-50/20 hover:text-sky-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Table className={`h-4 w-4 ${selectedReport === "utilization" ? "text-sky-600 dark:text-sky-400" : "text-zinc-405"}`} /> Fleet Utilization
          </button>

          <button
            onClick={() => setSelectedReport("roi")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all ${
              selectedReport === "roi"
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300"
                : "text-zinc-600 hover:bg-sky-50/20 hover:text-sky-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Table className={`h-4 w-4 ${selectedReport === "roi" ? "text-sky-600 dark:text-sky-400" : "text-zinc-405"}`} /> Operational Cost & ROI
          </button>

          <button
            onClick={() => setSelectedReport("efficiency")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all ${
              selectedReport === "efficiency"
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300"
                : "text-zinc-600 hover:bg-sky-50/20 hover:text-sky-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Table className={`h-4 w-4 ${selectedReport === "efficiency" ? "text-sky-600 dark:text-sky-400" : "text-zinc-405"}`} /> Fuel Efficiency
          </button>

          <button
            onClick={() => setSelectedReport("maintenance")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all ${
              selectedReport === "maintenance"
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300"
                : "text-zinc-600 hover:bg-sky-50/20 hover:text-sky-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Table className={`h-4 w-4 ${selectedReport === "maintenance" ? "text-sky-600 dark:text-sky-400" : "text-zinc-405"}`} /> Maintenance Summary
          </button>
        </div>

        {/* Right Side Report Preview and Actions */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 capitalize">
              {selectedReport} Report Preview
            </h2>

            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-red-350 hover:bg-red-50/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all"
              >
                <FileText className="h-4 w-4 text-red-500 dark:text-red-400" /> Export PDF
              </button>
            </div>
          </div>

          {/* Table Preview */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
              <tr className="border-b border-zinc-200 bg-sky-50/25 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                    {headers.map((h) => (
                      <th key={h} className="px-6 py-3.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length || 1} className="px-6 py-12 text-center text-zinc-500">
                        No report records compiled.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-sky-50/15 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {headers.map((h) => {
                          const val = row[h];
                          return (
                            <td
                              key={h}
                              className={`whitespace-nowrap px-6 py-4 ${
                                h === "Registration Number" || h === "Vehicle"
                                  ? "font-bold text-zinc-900 dark:text-zinc-100"
                                  : "text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              {typeof val === "number" && h.includes("$")
                                ? `$${val.toLocaleString()}`
                                : typeof val === "number" && h.includes("%")
                                ? `${val}%`
                                : val}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ReportsClient;
