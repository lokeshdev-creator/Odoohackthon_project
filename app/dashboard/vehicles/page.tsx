import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { VehiclesClient } from "./page.client";

export default async function VehiclesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();
  // Fetch non-deleted vehicles
  const vehicles = await Vehicle.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();

  // Serialize Mongoose models to plain JSON objects
  const serializedVehicles = JSON.parse(JSON.stringify(vehicles));

  return <VehiclesClient vehicles={serializedVehicles} />;
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
