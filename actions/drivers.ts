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
  region: z.string().min(1, "Region is required").trim(),
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
      region: formData.get("region")?.toString() || "North",
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

export async function sendLicenseExpiryReminders() {
  try {
    const { Notification } = await import("@/models/Notification");
    const { Resend } = await import("resend");

    await connectToDatabase();
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Find drivers whose licenses are expired or expiring in next 30 days
    const expiringDrivers = await Driver.find({
      licenseExpiry: { $lte: thirtyDaysFromNow },
    });

    if (expiringDrivers.length === 0) {
      return { success: true, message: "No expiring licenses found. Roster is fully compliant!" };
    }

    let emailsSent = 0;
    const resendApiKey = process.env.RESEND_API_KEY;
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    for (const driver of expiringDrivers) {
      const isAlreadyExpired = new Date(driver.licenseExpiry) < now;
      const title = isAlreadyExpired ? "License Expired Alert" : "License Expiration Warning";
      const message = `Driver ${driver.name}'s license (${driver.licenseNumber}) ${
        isAlreadyExpired ? "has expired" : `expires on ${new Date(driver.licenseExpiry).toLocaleDateString()}`
      }. Region: ${driver.region || "North"}.`;

      // Create system notification
      await Notification.create({
        type: "LicenseExpiry",
        title,
        message,
      });

      // Send email if Resend is configured
      if (resend) {
        try {
          await resend.emails.send({
            from: "alerts@transitops.com",
            to: driver.email || "admin@transitops.com",
            subject: `TransitOps Compliance: ${title} - ${driver.name}`,
            html: `<p>Dear Fleet Operator,</p>
                   <p>This is an automated compliance alert from TransitOps.</p>
                   <p><strong>${message}</strong></p>
                   <p>Please update their license details immediately in the dashboard.</p>`,
          });
          emailsSent++;
        } catch (emailErr) {
          console.error(`Failed to send email to ${driver.email}:`, emailErr);
        }
      } else {
        // Log simulated email
        console.log(`[SIMULATED EMAIL] To: ${driver.email} | Subject: TransitOps Compliance: ${title} | Message: ${message}`);
      }
    }

    revalidatePath("/dashboard");
    return {
      success: true,
      message: resendApiKey
        ? `Reminded ${expiringDrivers.length} drivers. ${emailsSent} emails sent successfully.`
        : `Scanned roster: ${expiringDrivers.length} alerts generated! (Simulated: notifications created & email logs outputted)`,
    };
  } catch (error: any) {
    console.error("sendLicenseExpiryReminders error:", error);
    return { success: false, error: error.message || "Failed to process reminders" };
  }
}
