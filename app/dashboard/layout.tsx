import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

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
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar Navigation */}
      <Sidebar user={safeUser} />

      {/* Main Panel Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Global Nav Header */}
        <Header />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
