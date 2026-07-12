import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { MaintenanceLog } from "@/models/MaintenanceLog";
import { Vehicle } from "@/models/Vehicle";
import { MaintenanceClient } from "./page.client";

export default async function MaintenancePage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();

  const logs = await MaintenanceLog.find({})
    .populate("vehicleId")
    .sort({ createdAt: -1 })
    .lean();

  // Allow choosing only non-deleted vehicles. Note: we can allow choosing vehicles in status Available.
  const vehicles = await Vehicle.find({
    isDeleted: false,
    status: { $in: ["Available", "In Shop"] },
  })
    .sort({ registrationNumber: 1 })
    .lean();

  const serializedLogs = JSON.parse(JSON.stringify(logs));
  const serializedVehicles = JSON.parse(JSON.stringify(vehicles));

  return <MaintenanceClient logs={serializedLogs} vehicles={serializedVehicles} />;
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
