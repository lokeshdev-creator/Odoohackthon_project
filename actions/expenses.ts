"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { FuelLog } from "@/models/FuelLog";
import { Expense } from "@/models/Expense";
import { Vehicle } from "@/models/Vehicle";

const FuelInputSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  liters: z.coerce.number().min(0.1, "Liters must be positive"),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  odometer: z.coerce.number().min(0, "Odometer cannot be negative"),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
});

const ExpenseInputSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  category: z.enum(["Fuel", "Maintenance", "Toll", "Repair", "Insurance", "Other"]),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  description: z.string().min(1, "Description is required").trim(),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
});

export async function addFuelLog(prevState: any, formData: FormData) {
  try {
    await connectToDatabase();

    const rawData = {
      vehicleId: formData.get("vehicleId")?.toString() || "",
      liters: formData.get("liters")?.toString() || "0",
      cost: formData.get("cost")?.toString() || "0",
      odometer: formData.get("odometer")?.toString() || "0",
      date: formData.get("date")?.toString() || "",
    };

    const validatedFields = FuelInputSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Check vehicle and update odometer
    const vehicle = await Vehicle.findById(data.vehicleId);
    if (!vehicle || vehicle.isDeleted) {
      return { success: false, error: { vehicleId: ["Vehicle not found"] } };
    }

    if (data.odometer < vehicle.odometer) {
      return {
        success: false,
        error: {
          odometer: [
            `Odometer reading cannot be less than current odometer (${vehicle.odometer} km)`,
          ],
        },
      };
    }

    // Update vehicle odometer
    vehicle.odometer = data.odometer;
    await vehicle.save();

    // Create fuel log
    await FuelLog.create(data);

    // Create matching fuel expense
    await Expense.create({
      vehicleId: data.vehicleId,
      category: "Fuel",
      amount: data.cost,
      description: `Fuel Refill: ${data.liters} Liters`,
      date: data.date,
    });

    revalidatePath("/dashboard/fuel");
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/vehicles");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("addFuelLog error:", error);
    return { success: false, errorMessage: error.message || "An unexpected error occurred" };
  }
}

export async function addExpense(prevState: any, formData: FormData) {
  try {
    await connectToDatabase();

    const rawData = {
      vehicleId: formData.get("vehicleId")?.toString() || "",
      category: formData.get("category")?.toString() || "Other",
      amount: formData.get("amount")?.toString() || "0",
      description: formData.get("description")?.toString() || "",
      date: formData.get("date")?.toString() || "",
    };

    const validatedFields = ExpenseInputSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Check vehicle
    const vehicle = await Vehicle.findById(data.vehicleId);
    if (!vehicle || vehicle.isDeleted) {
      return { success: false, error: { vehicleId: ["Vehicle not found"] } };
    }

    // Create expense
    await Expense.create(data);

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("addExpense error:", error);
    return { success: false, errorMessage: error.message || "An unexpected error occurred" };
  }
}
