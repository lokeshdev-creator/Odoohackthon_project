import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Driver } from "@/models/Driver";
import { DriversClient } from "./page.client";

export default async function DriversPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();
  const drivers = await Driver.find({}).sort({ createdAt: -1 }).lean();

  const serializedDrivers = JSON.parse(JSON.stringify(drivers));

  return <DriversClient drivers={serializedDrivers} />;
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
