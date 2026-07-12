import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { Vehicle } from "@/models/Vehicle";
import { ExpensesClient } from "./page.client";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();

  const expenses = await Expense.find({})
    .populate("vehicleId")
    .sort({ date: -1 })
    .lean();

  const vehicles = await Vehicle.find({ isDeleted: false })
    .sort({ registrationNumber: 1 })
    .lean();

  const serializedExpenses = JSON.parse(JSON.stringify(expenses));
  const serializedVehicles = JSON.parse(JSON.stringify(vehicles));

  return <ExpensesClient expenses={serializedExpenses} vehicles={serializedVehicles} />;
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
