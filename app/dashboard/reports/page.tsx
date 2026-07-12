import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { Trip } from "@/models/Trip";
import { MaintenanceLog } from "@/models/MaintenanceLog";
import { Expense } from "@/models/Expense";
import { ReportsClient } from "./page.client";

export default async function ReportsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();

  // Load all necessary records to build reports
  const vehicles = await Vehicle.find({ isDeleted: false }).lean();
  const trips = await Trip.find({ status: "Completed" }).populate("vehicleId").lean();
  const maintenance = await MaintenanceLog.find({}).populate("vehicleId").lean();
  const expenses = await Expense.find({}).lean();

  const serializedVehicles = JSON.parse(JSON.stringify(vehicles));
  const serializedTrips = JSON.parse(JSON.stringify(trips));
  const serializedMaintenance = JSON.parse(JSON.stringify(maintenance));
  const serializedExpenses = JSON.parse(JSON.stringify(expenses));

  return (
    <ReportsClient
      vehicles={serializedVehicles}
      trips={serializedTrips}
      maintenance={serializedMaintenance}
      expenses={serializedExpenses}
    />
  );
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
