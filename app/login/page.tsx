"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { label: "Admin", email: "admin@transitops.com" },
    { label: "Fleet Manager", email: "manager@transitops.com" },
    { label: "Dispatcher", email: "dispatcher@transitops.com" },
    { label: "Safety Officer", email: "safety@transitops.com" },
    { label: "Financial Analyst", email: "finance@transitops.com" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome to TransitOps!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error("An unexpected error occurred during login");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setLoading(true);
    toast.loading(`Signing in as ${demoEmail}...`, { id: "autofill-login" });
    try {
      const res = await signIn("credentials", {
        email: demoEmail,
        password: "password123",
        redirect: false,
      });

      if (res?.error) {
        toast.error("Invalid email or password", { id: "autofill-login" });
      } else {
        toast.success("Welcome to TransitOps!", { id: "autofill-login" });
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error("An unexpected error occurred during login", { id: "autofill-login" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        
        {/* Logo and Title */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign In to TransitOps
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Enter your fleet credentials to proceed
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500 dark:focus:border-sky-500 dark:focus:ring-sky-950/20"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500 dark:focus:border-sky-500 dark:focus:ring-sky-950/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm hover:shadow-[0_2px_8px_-1px_rgba(14,165,233,0.15)]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts Autofill */}
        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <span className="block text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Quick Demo Access (Click to Autofill)
          </span>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => handleAutofill(account.email)}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-left text-zinc-600 hover:border-sky-300 hover:bg-sky-50/20 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all cursor-pointer"
              >
                <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {account.label}
                </div>
                <div className="truncate text-[10px] text-zinc-500">{account.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
