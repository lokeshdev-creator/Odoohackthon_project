"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import { Notification } from "@/models/Notification";

export async function getRecentNotifications() {
  try {
    await connectToDatabase();
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    return {
      success: true,
      notifications: JSON.parse(JSON.stringify(notifications)),
    };
  } catch (error: any) {
    console.error("getRecentNotifications error:", error);
    return { success: false, notifications: [] };
  }
}

export async function markAsRead(id: string) {
  try {
    await connectToDatabase();
    await Notification.findByIdAndUpdate(id, { read: true });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("markAsRead error:", error);
    return { success: false };
  }
}

export async function markAllAsRead() {
  try {
    await connectToDatabase();
    await Notification.updateMany({ read: false }, { read: true });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("markAllAsRead error:", error);
    return { success: false };
  }
}
