"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";

const VehicleInputSchema = z.object({
  id: z.string().optional(),
  registrationNumber: z
    .string()
    .min(1, "Registration number is required")
    .transform((str) => str.trim().toUpperCase()),
  name: z.string().min(1, "Vehicle name is required").trim(),
  model: z.string().min(1, "Model is required").trim(),
  type: z.string().min(1, "Vehicle type is required").trim(),
  capacity: z.coerce.number().min(0, "Capacity cannot be negative"),
  odometer: z.coerce.number().min(0, "Odometer cannot be negative"),
  acquisitionCost: z.coerce.number().min(0, "Acquisition cost cannot be negative"),
  purchaseDate: z.string().or(z.date()).transform((val) => new Date(val)),
  status: z.enum(["Available", "On Trip", "In Shop", "Retired"]).default("Available"),
  region: z.string().min(1, "Region is required").trim(),
});

export async function saveVehicle(prevState: any, formData: FormData) {
  try {
    await connectToDatabase();

    const rawData = {
      id: formData.get("id")?.toString() || undefined,
      registrationNumber: formData.get("registrationNumber")?.toString() || "",
      name: formData.get("name")?.toString() || "",
      model: formData.get("model")?.toString() || "",
      type: formData.get("type")?.toString() || "",
      capacity: formData.get("capacity")?.toString() || "0",
      odometer: formData.get("odometer")?.toString() || "0",
      acquisitionCost: formData.get("acquisitionCost")?.toString() || "0",
      purchaseDate: formData.get("purchaseDate")?.toString() || "",
      status: (formData.get("status")?.toString() as any) || "Available",
      region: formData.get("region")?.toString() || "North",
    };

    const validatedFields = VehicleInputSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { id, registrationNumber, ...data } = validatedFields.data;

    // Check uniqueness of registration number
    const existingVehicle = await Vehicle.findOne({
      registrationNumber,
      isDeleted: false,
      _id: { $ne: id },
    });

    if (existingVehicle) {
      return {
        success: false,
        error: { registrationNumber: ["Registration number must be unique"] },
      };
    }

    if (id) {
      // Update
      await Vehicle.findByIdAndUpdate(id, { registrationNumber, ...data });
    } else {
      // Create
      await Vehicle.create({ registrationNumber, ...data });
    }

    revalidatePath("/dashboard/vehicles");
    return { success: true };
  } catch (error: any) {
    console.error("saveVehicle error:", error);
    return { success: false, errorMessage: error.message || "An unexpected error occurred" };
  }
}

export async function deleteVehicle(id: string) {
  try {
    await connectToDatabase();
    // Soft delete
    await Vehicle.findByIdAndUpdate(id, { isDeleted: true, status: "Retired" });
    revalidatePath("/dashboard/vehicles");
    return { success: true };
  } catch (error: any) {
    console.error("deleteVehicle error:", error);
    return { success: false, error: error.message || "Failed to delete vehicle" };
  }
}

export async function deleteVehicleDocument(vehicleId: string, docUrl: string) {
  try {
    await connectToDatabase();
    await Vehicle.findByIdAndUpdate(vehicleId, {
      $pull: { documents: { url: docUrl } },
    });
    revalidatePath("/dashboard/vehicles");
    return { success: true };
  } catch (error: any) {
    console.error("deleteVehicleDocument error:", error);
    return { success: false, error: error.message || "Failed to delete document" };
  }
}
