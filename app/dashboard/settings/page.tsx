import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "./page.client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const safeUser = {
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role,
  };

  return <SettingsClient user={safeUser} />;
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
