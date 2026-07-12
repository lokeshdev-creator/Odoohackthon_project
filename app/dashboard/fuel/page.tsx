import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { FuelLog } from "@/models/FuelLog";
import { Vehicle } from "@/models/Vehicle";
import { FuelClient } from "./page.client";

export default async function FuelLogsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();

  const logs = await FuelLog.find({})
    .populate("vehicleId")
    .sort({ date: -1 })
    .lean();

  const vehicles = await Vehicle.find({ isDeleted: false })
    .sort({ registrationNumber: 1 })
    .lean();

  const serializedLogs = JSON.parse(JSON.stringify(logs));
  const serializedVehicles = JSON.parse(JSON.stringify(vehicles));

  return <FuelClient logs={serializedLogs} vehicles={serializedVehicles} />;
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
