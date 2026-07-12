"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutWrapperProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  children: React.ReactNode;
}

export function DashboardLayoutWrapper({ user, children }: DashboardLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close sidebar on mobile when path changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Panel Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Nav Header with Mobile Menu Trigger */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
export default DashboardLayoutWrapper;
