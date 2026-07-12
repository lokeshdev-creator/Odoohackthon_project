"use server";

import { connectToDatabase } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { Driver } from "@/models/Driver";
import { Trip } from "@/models/Trip";
import { Expense } from "@/models/Expense";

export async function globalSearch(query: string) {
  if (!query || query.trim().length < 2) {
    return { vehicles: [], drivers: [], trips: [], expenses: [] };
  }

  try {
    await connectToDatabase();
    const regex = new RegExp(query.trim(), "i");

    // Perform queries concurrently
    const [vehicles, drivers, trips, expenses] = await Promise.all([
      Vehicle.find({
        isDeleted: false,
        $or: [{ registrationNumber: regex }, { name: regex }, { model: regex }, { type: regex }],
      })
        .limit(5)
        .lean(),
      Driver.find({
        $or: [{ name: regex }, { licenseNumber: regex }, { phone: regex }, { email: regex }],
      })
        .limit(5)
        .lean(),
      Trip.find({
        $or: [{ source: regex }, { destination: regex }],
      })
        .limit(5)
        .lean(),
      Expense.find({
        $or: [{ description: regex }, { category: regex }],
      })
        .limit(5)
        .populate("vehicleId", "registrationNumber name")
        .lean(),
    ]);

    return {
      vehicles: JSON.parse(JSON.stringify(vehicles)),
      drivers: JSON.parse(JSON.stringify(drivers)),
      trips: JSON.parse(JSON.stringify(trips)),
      expenses: JSON.parse(JSON.stringify(expenses)),
    };
  } catch (error) {
    console.error("Global search error:", error);
    return { vehicles: [], drivers: [], trips: [], expenses: [] };
  }
}
