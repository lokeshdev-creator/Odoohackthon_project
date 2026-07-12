"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const role = user.role || "Fleet Manager";

  // RBAC Link lists
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["Admin", "Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"],
    },
    {
      name: "Vehicles",
      href: "/dashboard/vehicles",
      icon: Truck,
      roles: ["Admin", "Fleet Manager"],
    },
    {
      name: "Drivers",
      href: "/dashboard/drivers",
      icon: Users,
      roles: ["Admin", "Fleet Manager", "Safety Officer"],
    },
    {
      name: "Trips",
      href: "/dashboard/trips",
      icon: Route,
      roles: ["Admin", "Fleet Manager", "Dispatcher"],
    },
    {
      name: "Maintenance",
      href: "/dashboard/maintenance",
      icon: Wrench,
      roles: ["Admin", "Fleet Manager"],
    },
    {
      name: "Fuel Logs",
      href: "/dashboard/fuel",
      icon: Fuel,
      roles: ["Admin", "Fleet Manager", "Financial Analyst"],
    },
    {
      name: "Expenses",
      href: "/dashboard/expenses",
      icon: DollarSign,
      roles: ["Admin", "Fleet Manager", "Financial Analyst"],
    },
    {
      name: "Reports & Analytics",
      href: "/dashboard/reports",
      icon: BarChart3,
      roles: ["Admin", "Fleet Manager", "Financial Analyst"],
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      roles: ["Admin", "Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"],
    },
  ];

  const visibleItems = navigationItems.filter((item) => item.roles.includes(role));

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-50 font-sans tracking-tight">
            TransitOps
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-900 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
          <ShieldCheck className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
          <span className="text-lg font-bold font-sans tracking-tight text-zinc-900 dark:text-zinc-50">
            TransitOps
          </span>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-semibold"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Log out */}
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 font-bold dark:bg-zinc-800 dark:text-zinc-200">
                {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {user.name || "User"}
                </span>
                <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {role}
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
