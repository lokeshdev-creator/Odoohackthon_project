"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Driver } from "@/models/Driver";

const DriverInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required").trim(),
  phone: z.string().min(1, "Phone number is required").trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  licenseNumber: z
    .string()
    .min(1, "License number is required")
    .transform((str) => str.trim().toUpperCase()),
  licenseCategory: z.string().min(1, "License category is required").trim(),
  licenseExpiry: z.string().or(z.date()).transform((val) => new Date(val)),
  safetyScore: z.coerce.number().min(0).max(100).default(100),
  status: z.enum(["Available", "On Trip", "Off Duty", "Suspended"]).default("Available"),
});

export async function saveDriver(prevState: any, formData: FormData) {
  try {
    await connectToDatabase();

    const rawData = {
      id: formData.get("id")?.toString() || undefined,
      name: formData.get("name")?.toString() || "",
      phone: formData.get("phone")?.toString() || "",
      email: formData.get("email")?.toString() || "",
      licenseNumber: formData.get("licenseNumber")?.toString() || "",
      licenseCategory: formData.get("licenseCategory")?.toString() || "",
      licenseExpiry: formData.get("licenseExpiry")?.toString() || "",
      safetyScore: formData.get("safetyScore")?.toString() || "100",
      status: (formData.get("status")?.toString() as any) || "Available",
    };

    const validatedFields = DriverInputSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { id, licenseNumber, ...data } = validatedFields.data;

    // Check unique license number
    const existingDriver = await Driver.findOne({
      licenseNumber,
      _id: { $ne: id },
    });

    if (existingDriver) {
      return {
        success: false,
        error: { licenseNumber: ["License number must be unique"] },
      };
    }

    if (id) {
      await Driver.findByIdAndUpdate(id, { licenseNumber, ...data });
    } else {
      await Driver.create({ licenseNumber, ...data });
    }

    revalidatePath("/dashboard/drivers");
    return { success: true };
  } catch (error: any) {
    console.error("saveDriver error:", error);
    return { success: false, errorMessage: error.message || "An unexpected error occurred" };
  }
}

export async function deleteDriver(id: string) {
  try {
    await connectToDatabase();
    await Driver.findByIdAndDelete(id);
    revalidatePath("/dashboard/drivers");
    return { success: true };
  } catch (error: any) {
    console.error("deleteDriver error:", error);
    return { success: false, error: error.message || "Failed to delete driver" };
  }
}
