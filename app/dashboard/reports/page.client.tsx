"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, Table } from "lucide-react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

interface Driver {
  _id: string;
  name: string;
  phone: string;
  licenseNumber: string;
}

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
  driverId?: Driver;
  actualDistance?: number;
  fuelConsumed?: number;
  revenue: number;
  status: string;
  dispatchDate?: string;
  completionDate?: string;
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
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  expenses: Expense[];
}

type ReportType = "utilization" | "roi" | "efficiency" | "maintenance" | "driverHistory";

export function ReportsClient({ vehicles, drivers, trips, maintenance, expenses }: ReportsClientProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>("utilization");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("all");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");

  // 1. Compile Fleet Utilization Report Data
  const getUtilizationData = () => {
    return vehicles.map((v) => {
      const completedTripsCount = trips.filter((t) => t.status === "Completed" && t.vehicleId?._id === v._id).length;
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
      const vTrips = trips.filter((t) => t.status === "Completed" && t.vehicleId?._id === v._id);
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
      const vTrips = trips.filter((t) => t.status === "Completed" && t.vehicleId?._id === v._id);
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

  // 5. Compile Driver History Report Data
  const getDriverHistoryData = () => {
    let relevantTrips = trips.filter((t) => t.driverId && t.vehicleId && t.status !== "Draft");

    if (selectedDriverId !== "all") {
      relevantTrips = relevantTrips.filter((t) => t.driverId?._id === selectedDriverId);
    }

    if (selectedVehicleId !== "all") {
      relevantTrips = relevantTrips.filter((t) => t.vehicleId?._id === selectedVehicleId);
    }

    return relevantTrips.map((t) => {
      const dispatchStr = t.dispatchDate ? new Date(t.dispatchDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-";
      const completionStr = t.completionDate ? new Date(t.completionDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : (t.status === "Dispatched" ? "On Trip (Ongoing)" : "-");

      return {
        "Driver Name": t.driverId?.name || "Unknown Driver",
        "Vehicle": `${t.vehicleId?.name} (${t.vehicleId?.registrationNumber})`,
        "Route": `${t.source} to ${t.destination}`,
        "Departure Time": dispatchStr,
        "Return Time": completionStr,
        "Fuel Consumed (L)": t.fuelConsumed !== null && t.fuelConsumed !== undefined ? `${t.fuelConsumed} L` : "-",
        "Status": t.status,
      };
    });
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
      case "driverHistory":
        return getDriverHistoryData();
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
      
      // Determine column widths based on report type (total printable width is 190mm)
      const getColWidths = (report: ReportType): number[] => {
        switch (report) {
          case "utilization":
            return [35, 45, 35, 35, 40];
          case "roi":
            return [30, 35, 23, 35, 23, 24, 20];
          case "efficiency":
            return [35, 45, 35, 35, 40];
          case "maintenance":
            return [30, 40, 20, 32, 32, 36];
          case "driverHistory":
            return [27, 30, 32, 32, 32, 22, 15];
          default:
            return headers.map(() => 190 / headers.length);
        }
      };

      const colWidths = getColWidths(selectedReport);

      // Helper function to truncate cell text that exceeds column width
      const formatCellText = (text: string, maxWidth: number): string => {
        if (doc.getTextWidth(text) <= maxWidth) return text;
        let truncated = text;
        while (truncated.length > 0 && doc.getTextWidth(truncated + "...") > maxWidth) {
          truncated = truncated.slice(0, -1);
        }
        return truncated + "...";
      };

      // --- PAGE 1 HEADER ---
      // Top accent strip
      doc.setFillColor(2, 132, 199); // Sky 600
      doc.rect(0, 0, 210, 4, "F");

      // Brand Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text("TransitOps", 10, 16);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.text("SMART TRANSPORT OPERATIONS PLATFORM", 10, 21);

      // Report Header info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(2, 132, 199); // Sky 600
      const formattedTitle = selectedReport.replace(/([A-Z])/g, ' $1').toUpperCase();
      doc.text(`${formattedTitle} REPORT`, 10, 30);
      
      // Date info on right
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Slate 500
      const dateStr = `Generated: ${new Date().toLocaleDateString("en-IN")} ${new Date().toLocaleTimeString("en-IN")}`;
      doc.text(dateStr, 200, 30, { align: "right" });

      // Border line under header
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.5);
      doc.line(10, 34, 200, 34);

      let y = 45; // Start y coordinate for table
      
      // Draw Headers
      doc.setFillColor(2, 132, 199); // Sky 600
      doc.rect(10, y - 5, 190, 8, "F"); // Header background rect
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255); // White
      
      let currentX = 10;
      headers.forEach((h, i) => {
        const colW = colWidths[i];
        doc.text(h, currentX + 2, y);
        currentX += colW;
      });
      
      y += 8; // Row content start
      
      // Draw Rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42); // Slate 900
      
      rows.forEach((row, rowIndex) => {
        // Page boundary check
        if (y + 8 > 275) {
          doc.addPage();
          
          // Draw new page top strip
          doc.setFillColor(2, 132, 199); // Sky 600 accent
          doc.rect(0, 0, 210, 4, "F");
          
          y = 20; // reset y
          
          // Redraw Headers on new page
          doc.setFillColor(2, 132, 199); // Sky 600
          doc.rect(10, y - 5, 190, 8, "F");
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(255, 255, 255); // White
          
          let headerX = 10;
          headers.forEach((h, i) => {
            const colW = colWidths[i];
            doc.text(h, headerX + 2, y);
            headerX += colW;
          });
          
          y += 8; // move past header
          
          // Reset row font
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42); // Slate 900
        }
        
        // Alternating row background
        if (rowIndex % 2 === 1) {
          doc.setFillColor(248, 250, 252); // Slate 50
          doc.rect(10, y - 5, 190, 7, "F");
        }
        
        // Draw grid lines
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setLineWidth(0.1);
        doc.line(10, y + 2, 200, y + 2);
        
        let rowX = 10;
        headers.forEach((headerKey, i) => {
          const colW = colWidths[i];
          const val = String(row[headerKey] !== null && row[headerKey] !== undefined ? row[headerKey] : "-");
          
          // Truncate if too long
          const padding = 4;
          const formattedVal = formatCellText(val, colW - padding);
          
          doc.text(formattedVal, rowX + 2, y);
          rowX += colW;
        });
        
        y += 7; // move to next row
      });

      // --- PAGE NUMBERS FOOTER ---
      const pageCount = doc.internal.pages.length - 1; // get total pages
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text("TransitOps Platform - Confidential Fleet Report", 10, 287);
        doc.text(`Page ${i} of ${pageCount}`, 200, 287, { align: "right" });
      }

      doc.save(`transitops_${selectedReport}_report.pdf`);
      toast.success("PDF report downloaded successfully!");
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

          <button
            onClick={() => setSelectedReport("driverHistory")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all ${
              selectedReport === "driverHistory"
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300"
                : "text-zinc-600 hover:bg-sky-50/20 hover:text-sky-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Table className={`h-4 w-4 ${selectedReport === "driverHistory" ? "text-sky-600 dark:text-sky-400" : "text-zinc-405"}`} /> Driver History
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

          {selectedReport === "driverHistory" && (
            <div className="flex flex-col sm:flex-row gap-3 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Filter by Driver</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 w-full focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="all">All Drivers</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.licenseNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Filter by Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 w-full focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="all">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

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
