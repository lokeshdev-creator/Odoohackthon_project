"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { MaintenanceLog } from "@/models/MaintenanceLog";
import { Vehicle } from "@/models/Vehicle";
import { Expense } from "@/models/Expense";
import { Notification } from "@/models/Notification";

const MaintenanceInputSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  type: z.string().min(1, "Service type is required").trim(),
  description: z.string().min(1, "Description is required").trim(),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)),
});

export async function createMaintenance(prevState: any, formData: FormData) {
  try {
    await connectToDatabase();

    const rawData = {
      vehicleId: formData.get("vehicleId")?.toString() || "",
      type: formData.get("type")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      cost: formData.get("cost")?.toString() || "0",
      startDate: formData.get("startDate")?.toString() || "",
      endDate: formData.get("endDate")?.toString() || "",
    };

    const validatedFields = MaintenanceInputSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Check if vehicle is available to place in shop
    const vehicle = await Vehicle.findById(data.vehicleId);
    if (!vehicle || vehicle.isDeleted) {
      return { success: false, error: { vehicleId: ["Vehicle not found"] } };
    }

    if (vehicle.status !== "Available" && vehicle.status !== "In Shop") {
      return {
        success: false,
        error: {
          vehicleId: [
            `Vehicle status is currently '${vehicle.status}'. Must be Available to enter Maintenance.`,
          ],
        },
      };
    }

    // Create log
    await MaintenanceLog.create({
      ...data,
      status: "Open",
    });

    // Automatically Lock Vehicle to "In Shop"
    vehicle.status = "In Shop";
    await vehicle.save();

    // Create notification reminder
    await Notification.create({
      type: "MaintenanceReminder",
      title: "Vehicle Sent to Maintenance",
      message: `Vehicle ${vehicle.registrationNumber} (${vehicle.name}) has been marked as In Shop for ${data.type}.`,
    });

    revalidatePath("/dashboard/maintenance");
    revalidatePath("/dashboard/vehicles");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("createMaintenance error:", error);
    return { success: false, errorMessage: error.message || "An unexpected error occurred" };
  }
}

export async function closeMaintenance(logId: string) {
  try {
    await connectToDatabase();

    const log = await MaintenanceLog.findById(logId);
    if (!log) {
      return { success: false, error: "Maintenance record not found" };
    }

    if (log.status === "Closed") {
      return { success: false, error: "Maintenance is already closed" };
    }

    const vehicle = await Vehicle.findById(log.vehicleId);
    if (!vehicle) {
      return { success: false, error: "Vehicle not found" };
    }

    // Set status to Closed
    log.status = "Closed";
    log.endDate = new Date();
    await log.save();

    // Unlock Vehicle status back to Available unless it is Retired
    if (vehicle.status !== "Retired") {
      vehicle.status = "Available";
      await vehicle.save();
    }

    // Automatically log maintenance cost as an Expense
    await Expense.create({
      vehicleId: vehicle._id,
      category: "Maintenance",
      amount: log.cost,
      description: `Service: ${log.type} - ${log.description}`,
      date: new Date(),
    });

    // Create notification
    await Notification.create({
      type: "VehicleReturned",
      title: "Maintenance Completed",
      message: `Maintenance for ${vehicle.registrationNumber} completed. Vehicle status is now Available.`,
    });

    revalidatePath("/dashboard/maintenance");
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/vehicles");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("closeMaintenance error:", error);
    return { success: false, error: error.message || "Failed to close maintenance log" };
  }
}
