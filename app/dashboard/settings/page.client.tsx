"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Database, Loader2, User, Key, Check } from "lucide-react";
import { toast } from "sonner";

interface SettingsClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function SettingsClient({ user }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const [loadingSeed, setLoadingSeed] = useState(false);

  const handleSeedDatabase = async () => {
    if (
      !confirm(
        "WARNING: This will completely wipe all vehicles, drivers, trips, maintenance logs, fuel logs, and expenses, and replace them with standard sample data. Are you sure you want to proceed?"
      )
    ) {
      return;
    }

    setLoadingSeed(true);
    toast.info("Clearing and seeding database... please wait.", { duration: 5000 });

    try {
      const res = await fetch("/api/seed");
      const data = await res.json();

      if (data.success) {
        toast.success("Database seeded successfully! Reloading page...");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(data.error || "Failed to seed database.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during database seeding.");
    } finally {
      setLoadingSeed(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
          Account & Platform Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Review your account profile details, system roles, and trigger development database tasks.
        </p>
      </div>

      {/* Profile details */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          <User className="h-4 w-4" /> User Profile Information
        </h3>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-3 gap-2 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="font-medium text-zinc-500">Full Name</span>
            <span className="col-span-2 font-semibold text-zinc-900 dark:text-zinc-50">{user.name}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="font-medium text-zinc-500">Email Address</span>
            <span className="col-span-2 text-zinc-900 dark:text-zinc-550">{user.email}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2">
            <span className="font-medium text-zinc-500">System Role</span>
            <span className="col-span-2 font-mono text-zinc-900 dark:text-zinc-50">
              <span className="rounded bg-sky-50 text-sky-700 px-2 py-0.5 text-xs font-bold dark:bg-sky-950/30 dark:text-sky-300">
                {user.role}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Theme Toggling */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          Display Theme Control
        </h3>

        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-all ${
              theme === "light"
                ? "border-sky-500 bg-sky-50/50 text-sky-750 dark:border-sky-500 dark:bg-sky-950/20 dark:text-sky-300"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-sky-200 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950"
            }`}
          >
            <Sun className="h-4 w-4" /> Light Mode
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-all ${
              theme === "dark"
                ? "border-sky-500 bg-sky-950/30 text-sky-300 dark:border-sky-500 dark:bg-sky-950/20 dark:text-sky-300"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-sky-200 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950"
            }`}
          >
            <Moon className="h-4 w-4" /> Dark Mode
          </button>
        </div>
      </div>

      {/* Database utilities */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-2">
          <Database className="h-4 w-4" /> System Administrative Tasks
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Perform administrative database actions. Seeding resets all vehicles, drivers, trips, and expenses to default mock profiles.
        </p>

        <button
          onClick={handleSeedDatabase}
          disabled={loadingSeed}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 transition-all hover:bg-red-100 dark:border-red-950/30 dark:bg-red-950/10 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-50"
        >
          {loadingSeed ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Seeding Database...
            </>
          ) : (
            <>
              <Database className="h-4 w-4" /> Seed / Reset Database Data
            </>
          )}
        </button>
      </div>
    </div>
  );
}
export default SettingsClient;
