"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import { FuelLog } from "@/models/FuelLog";
import { Vehicle } from "@/models/Vehicle";
import { Expense } from "@/models/Expense";
import { auth } from "@/lib/auth";

export async function logDriverFuel(
  vehicleId: string,
  liters: number,
  cost: number,
  odometer: number
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Not authenticated" };
    }

    const role = (session.user as any).role;
    if (role !== "Driver" && role !== "Admin" && role !== "Fleet Manager") {
      return { success: false, error: "Unauthorized to perform this action" };
    }

    await connectToDatabase();

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.isDeleted) {
      return { success: false, error: "Vehicle not found" };
    }

    if (odometer < vehicle.odometer) {
      return {
        success: false,
        error: `Submitted odometer (${odometer} km) cannot be less than current vehicle odometer (${vehicle.odometer} km)`,
      };
    }

    // Update vehicle odometer
    vehicle.odometer = odometer;
    await vehicle.save();

    // Create Fuel Log entry
    await FuelLog.create({
      vehicleId,
      liters,
      cost,
      odometer,
      date: new Date(),
    });

    // Create Expense entry
    await Expense.create({
      vehicleId,
      category: "Fuel",
      amount: cost,
      description: `Fuel purchase logged by driver ${session.user.name}`,
      date: new Date(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/fuel");
    return { success: true };
  } catch (error: any) {
    console.error("logDriverFuel error:", error);
    return { success: false, error: error.message || "Failed to log fuel refill" };
  }
}
