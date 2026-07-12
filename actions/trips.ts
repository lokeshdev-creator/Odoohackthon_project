"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Trip } from "@/models/Trip";
import { Vehicle } from "@/models/Vehicle";
import { Driver } from "@/models/Driver";
import { FuelLog } from "@/models/FuelLog";
import { Expense } from "@/models/Expense";
import { Notification } from "@/models/Notification";
import { auth } from "@/lib/auth";

const TripInputSchema = z.object({
  id: z.string().optional(),
  source: z.string().min(1, "Source is required").trim(),
  destination: z.string().min(1, "Destination is required").trim(),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  cargoWeight: z.coerce.number().min(0.1, "Cargo weight must be positive"),
  plannedDistance: z.coerce.number().min(0.1, "Planned distance must be positive"),
  revenue: z.coerce.number().min(0, "Revenue cannot be negative"),
  status: z.enum(["Draft", "Dispatched", "Completed", "Cancelled"]).default("Draft"),
});

export async function saveTrip(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role === "Driver") {
      return { success: false, errorMessage: "Unauthorized: Drivers cannot create or edit trips." };
    }

    await connectToDatabase();

    const rawData = {
      id: formData.get("id")?.toString() || undefined,
      source: formData.get("source")?.toString() || "",
      destination: formData.get("destination")?.toString() || "",
      vehicleId: formData.get("vehicleId")?.toString() || "",
      driverId: formData.get("driverId")?.toString() || "",
      cargoWeight: formData.get("cargoWeight")?.toString() || "0",
      plannedDistance: formData.get("plannedDistance")?.toString() || "0",
      revenue: formData.get("revenue")?.toString() || "0",
      status: (formData.get("status")?.toString() as any) || "Draft",
    };

    const validatedFields = TripInputSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Validate cargo weight <= vehicle capacity
    const vehicle = await Vehicle.findById(data.vehicleId);
    if (!vehicle) {
      return { success: false, error: { vehicleId: ["Selected vehicle not found"] } };
    }

    if (data.cargoWeight > vehicle.capacity) {
      return {
        success: false,
        error: {
          cargoWeight: [`Cargo weight exceeds vehicle capacity (${vehicle.capacity} kg)`],
        },
      };
    }

    // If new or updating draft, ensure driver license isn't expired
    const driver = await Driver.findById(data.driverId);
    if (!driver) {
      return { success: false, error: { driverId: ["Selected driver not found"] } };
    }

    const now = new Date();
    if (new Date(driver.licenseExpiry) < now) {
      return {
        success: false,
        error: { driverId: ["Selected driver has an expired license"] },
      };
    }

    if (driver.status === "Suspended") {
      return {
        success: false,
        error: { driverId: ["Selected driver is suspended"] },
      };
    }

    if (data.id) {
      await Trip.findByIdAndUpdate(data.id, data);
    } else {
      await Trip.create(data);
    }

    revalidatePath("/dashboard/trips");
    return { success: true };
  } catch (error: any) {
    console.error("saveTrip error:", error);
    return { success: false, errorMessage: error.message || "An unexpected error occurred" };
  }
}

export async function dispatchTrip(tripId: string) {
  try {
    const session = await auth();
    await connectToDatabase();

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    const role = (session?.user as any)?.role;
    if (role === "Driver") {
      const driverRecord = await Driver.findOne({ email: session?.user?.email }).lean();
      if (!driverRecord || trip.driverId.toString() !== driverRecord._id.toString()) {
        return { success: false, error: "Unauthorized: You can only dispatch trips assigned to you." };
      }
    }

    if (trip.status !== "Draft") {
      return { success: false, error: "Only draft trips can be dispatched" };
    }

    const vehicle = await Vehicle.findById(trip.vehicleId);
    if (!vehicle || vehicle.isDeleted) {
      return { success: false, error: "Vehicle not found" };
    }

    if (vehicle.status !== "Available") {
      return { success: false, error: `Vehicle is not available (Current status: ${vehicle.status})` };
    }

    const driver = await Driver.findById(trip.driverId);
    if (!driver) {
      return { success: false, error: "Driver not found" };
    }

    if (driver.status !== "Available") {
      return { success: false, error: `Driver is not available (Current status: ${driver.status})` };
    }

    if (new Date(driver.licenseExpiry) < new Date()) {
      return { success: false, error: "Driver driving license has expired" };
    }

    if (driver.status === "Suspended") {
      return { success: false, error: "Driver is suspended" };
    }

    // Auto-update statuses
    vehicle.status = "On Trip";
    driver.status = "On Trip";
    trip.status = "Dispatched";
    trip.dispatchDate = new Date();

    await vehicle.save();
    await driver.save();
    await trip.save();

    revalidatePath("/dashboard/trips");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("dispatchTrip error:", error);
    return { success: false, error: error.message || "Failed to dispatch trip" };
  }
}

export async function completeTrip(
  tripId: string,
  actualDistance: number,
  fuelConsumed: number,
  fuelCost: number
) {
  try {
    const session = await auth();
    await connectToDatabase();

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    const role = (session?.user as any)?.role;
    if (role === "Driver") {
      const driverRecord = await Driver.findOne({ email: session?.user?.email }).lean();
      if (!driverRecord || trip.driverId.toString() !== driverRecord._id.toString()) {
        return { success: false, error: "Unauthorized: You can only complete trips assigned to you." };
      }
    }

    if (trip.status !== "Dispatched") {
      return { success: false, error: "Only dispatched trips can be completed" };
    }

    const vehicle = await Vehicle.findById(trip.vehicleId);
    const driver = await Driver.findById(trip.driverId);

    // Update trip details
    trip.status = "Completed";
    trip.actualDistance = actualDistance;
    trip.fuelConsumed = fuelConsumed;
    trip.completionDate = new Date();
    await trip.save();

    // Restore vehicle & driver status
    if (vehicle) {
      vehicle.status = "Available";
      vehicle.odometer += actualDistance;
      await vehicle.save();

      // Log Fuel Log automatically if fuel was consumed
      if (fuelConsumed > 0) {
        await FuelLog.create({
          vehicleId: vehicle._id,
          liters: fuelConsumed,
          cost: fuelCost,
          odometer: vehicle.odometer,
          date: new Date(),
        });

        // Log fuel expense
        await Expense.create({
          vehicleId: vehicle._id,
          category: "Fuel",
          amount: fuelCost,
          description: `Fuel for Trip: ${trip.source} to ${trip.destination}`,
          date: new Date(),
        });
      }
    }

    if (driver) {
      driver.status = "Available";
      // Auto increment/decrement safety score for fun based on trip completion
      driver.safetyScore = Math.min(100, driver.safetyScore + 1);
      await driver.save();
    }

    // Create notifications
    await Notification.create({
      type: "TripCompleted",
      title: "Trip Completed",
      message: `Trip from ${trip.source} to ${trip.destination} has been completed. Odometer reading updated.`,
    });

    await Notification.create({
      type: "VehicleReturned",
      title: "Vehicle Returned",
      message: `Vehicle ${vehicle?.registrationNumber || ""} is returned and is now Available.`,
    });

    revalidatePath("/dashboard/trips");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("completeTrip error:", error);
    return { success: false, error: error.message || "Failed to complete trip" };
  }
}

export async function cancelTrip(tripId: string) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role === "Driver") {
      return { success: false, error: "Unauthorized: Drivers cannot cancel trips." };
    }

    await connectToDatabase();

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    const vehicle = await Vehicle.findById(trip.vehicleId);
    const driver = await Driver.findById(trip.driverId);

    // If trip was dispatched, restore statuses
    if (trip.status === "Dispatched") {
      if (vehicle) {
        vehicle.status = "Available";
        await vehicle.save();
      }
      if (driver) {
        driver.status = "Available";
        await driver.save();
      }
    }

    trip.status = "Cancelled";
    await trip.save();

    revalidatePath("/dashboard/trips");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("cancelTrip error:", error);
    return { success: false, error: error.message || "Failed to cancel trip" };
  }
}
