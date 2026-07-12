import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardLayoutWrapper } from "@/components/layout/DashboardLayoutWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Guard: if somehow middleware is bypassed, redirect to login
  if (!session || !session.user) {
    redirect("/login");
  }

  // Sanitize user object for safety
  const safeUser = {
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role,
  };

  return (
    <DashboardLayoutWrapper user={safeUser}>
      {children}
    </DashboardLayoutWrapper>
  );
}
