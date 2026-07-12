import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Trip } from "@/models/Trip";
import { Vehicle } from "@/models/Vehicle";
import { Driver } from "@/models/Driver";
import { TripsClient } from "./page.client";

export default async function TripsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();

  // Fetch trips populated with vehicle and driver info
  const trips = await Trip.find({})
    .populate("vehicleId")
    .populate("driverId")
    .sort({ createdAt: -1 })
    .lean();

  // Fetch available vehicles (Available status and not deleted)
  const availableVehicles = await Vehicle.find({
    status: "Available",
    isDeleted: false,
  })
    .sort({ registrationNumber: 1 })
    .lean();

  // Fetch available drivers (Available status and license not expired)
  const now = new Date();
  const availableDrivers = await Driver.find({
    status: "Available",
    licenseExpiry: { $gt: now },
  })
    .sort({ name: 1 })
    .lean();

  const serializedTrips = JSON.parse(JSON.stringify(trips));
  const serializedVehicles = JSON.parse(JSON.stringify(availableVehicles));
  const serializedDrivers = JSON.parse(JSON.stringify(availableDrivers));

  return (
    <TripsClient
      trips={serializedTrips}
      availableVehicles={serializedVehicles}
      availableDrivers={serializedDrivers}
    />
  );
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
