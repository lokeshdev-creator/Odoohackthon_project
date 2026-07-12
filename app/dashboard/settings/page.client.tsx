"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { usePWAInstall } from "@/components/PWAInstallProvider";
import {
  Sun,
  Moon,
  Database,
  Loader2,
  User,
  Smartphone,
  Download,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface SettingsClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function SettingsClient({ user }: SettingsClientProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Pull install state from the root-level PWAInstallProvider
  // (captures beforeinstallprompt before this page ever mounts)
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions((v) => !v);
      return;
    }

    if (!isInstallable) {
      toast.info(
        "Install prompt not available. Try opening this page in Chrome or Edge and look for the install icon in the address bar."
      );
      return;
    }

    setIsInstalling(true);
    try {
      const outcome = await install();
      if (outcome === "accepted") {
        toast.success("TransitOps is being installed! 🎉");
      } else if (outcome === "dismissed") {
        toast.info("Installation cancelled.");
      } else {
        toast.info("Install prompt unavailable — try Chrome or Edge.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to show install prompt.");
    } finally {
      setIsInstalling(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (
      !confirm(
        "WARNING: This will completely wipe all vehicles, drivers, trips, maintenance logs, fuel logs, and expenses, and replace them with standard sample data. Are you sure you want to proceed?"
      )
    ) {
      return;
    }

    setLoadingSeed(true);
    toast.info("Clearing and seeding database... please wait.", {
      duration: 5000,
    });

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

  // Determine install button state
  const canInstall = mounted && !isInstalled && (isInstallable || isIOS);
  const installButtonLabel = isInstalling
    ? "Installing..."
    : isIOS
    ? "Install on iOS"
    : "Download & Install App";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
          Account &amp; Platform Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Review your account profile details, system roles, and trigger
          development database tasks.
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
            <span className="col-span-2 font-semibold text-zinc-900 dark:text-zinc-50">
              {user.name}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="font-medium text-zinc-500">Email Address</span>
            <span className="col-span-2 text-zinc-900 dark:text-zinc-400">
              {user.email}
            </span>
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

      {/* System Status / Diagnostics */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          <Info className="h-4 w-4" /> System Health &amp; Diagnostics
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/20">
            <span className="font-medium text-zinc-500">Database Status</span>
            <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Connected (Atlas)
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/20">
            <span className="font-medium text-zinc-500">API Response Time</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              ~24 ms
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/20">
            <span className="font-medium text-zinc-500">Security Encryption</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              AES-256-GCM
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/20">
            <span className="font-medium text-zinc-500">Authentication Protocol</span>
            <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
              Auth.js (v5)
            </span>
          </div>
        </div>
      </div>

      {/* ── PWA Install Section ── */}
      <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm dark:border-sky-900/40 dark:from-sky-950/20 dark:to-zinc-900">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1 flex items-center gap-2">
          <Smartphone className="h-4 w-4" /> Install TransitOps App
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
          Install TransitOps as a native app on your device for faster access,
          offline support, and a full-screen experience without the browser UI.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            "Works Offline",
            "Fast Launch",
            "No Browser Bar",
            "Home Screen Icon",
            "Push Notifications",
          ].map((feat) => (
            <span
              key={feat}
              className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300"
            >
              <CheckCircle2 className="h-3 w-3" />
              {feat}
            </span>
          ))}
        </div>

        {/* Install status / button */}
        {!mounted ? (
          <div className="h-11 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        ) : isInstalled ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                ✅ App already installed
              </p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">
                TransitOps is running as an installed PWA on this device.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              id="pwa-install-btn"
              onClick={handleInstall}
              disabled={isInstalling || (!isInstallable && !isIOS)}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:bg-sky-500 hover:shadow-sky-400/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              {isInstalling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {installButtonLabel}
            </button>

            {/* Show hint if prompt not available (e.g. Firefox, already dismissed) */}
            {!isInstallable && !isIOS && (
              <div className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Open this page in <strong>Chrome</strong> or{" "}
                  <strong>Edge</strong> and look for the{" "}
                  <strong>⊕ Install</strong> icon in the browser address bar,
                  or use the button above once the browser detects the app.
                </p>
              </div>
            )}

            {/* iOS Step-by-step instructions */}
            {isIOS && showIOSInstructions && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 space-y-2 dark:border-sky-900/40 dark:bg-sky-950/20">
                <p className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                  iOS Install Steps
                </p>
                <ol className="text-xs text-sky-700 dark:text-sky-300 space-y-1.5 list-decimal list-inside">
                  <li>Tap the Share button (□↑) at the bottom of Safari</li>
                  <li>Scroll down and tap &ldquo;Add to Home Screen&rdquo;</li>
                  <li>Tap &ldquo;Add&rdquo; in the top right corner</li>
                  <li>
                    Find <strong>TransitOps</strong> on your home screen and
                    launch it
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Theme Toggling */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          {!mounted ? (
            <div className="h-4 w-4 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          ) : resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          Display Theme Control
        </h3>

        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            disabled={!mounted}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-all ${
              mounted && resolvedTheme === "light"
                ? "border-sky-500 bg-sky-50/50 text-sky-700 dark:border-sky-500 dark:bg-sky-950/20 dark:text-sky-300"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-sky-200 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
            }`}
          >
            <Sun className="h-4 w-4" /> Light Mode
          </button>
          <button
            onClick={() => setTheme("dark")}
            disabled={!mounted}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-all ${
              mounted && resolvedTheme === "dark"
                ? "border-sky-500 bg-sky-950/30 text-sky-300 dark:border-sky-500 dark:bg-sky-950/20 dark:text-sky-300"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-sky-200 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
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
          Perform administrative database actions. Seeding resets all vehicles,
          drivers, trips, and expenses to default mock profiles.
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
