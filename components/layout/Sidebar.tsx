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
  ShieldCheck,
} from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const role = user.role || "Fleet Manager";

  // RBAC Link lists
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["Admin", "Fleet Manager", "Dispatcher", "Driver", "Safety Officer", "Financial Analyst"],
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
      roles: ["Admin", "Fleet Manager", "Dispatcher", "Driver"],
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
      roles: ["Admin", "Fleet Manager", "Dispatcher", "Driver", "Safety Officer", "Financial Analyst"],
    },
  ];

  const visibleItems = navigationItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-900 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
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
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300 font-semibold"
                    : "text-zinc-600 hover:bg-sky-50/30 hover:text-sky-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-sky-600 dark:text-sky-400" : "text-zinc-400 dark:text-zinc-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Log out */}
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700 font-bold dark:bg-sky-950/40 dark:text-sky-300">
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
              onClick={async () => {
                await signOut({ redirect: false });
                window.location.href = "/login";
              }}
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
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
export default Sidebar;
