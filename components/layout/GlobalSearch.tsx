"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Truck, User, MapPin, DollarSign, X } from "lucide-react";
import { globalSearch } from "@/actions/search";

interface GlobalSearchProps {
  onClose?: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    vehicles: any[];
    drivers: any[];
    trips: any[];
    expenses: any[];
  }>({ vehicles: [], drivers: [], trips: [], expenses: [] });

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults({ vehicles: [], drivers: [], trips: [], expenses: [] });
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Query search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ vehicles: [], drivers: [], trips: [], expenses: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await globalSearch(query);
        setResults(searchResults);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    onClose?.();
    router.push(path);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500 hover:border-sky-300 hover:bg-sky-50/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 sm:w-64 transition-all"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search vehicles, drivers...</span>
        <span className="ml-auto hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 sm:inline">
          Ctrl K
        </span>
      </button>
    );
  }

  const hasResults =
    results.vehicles.length > 0 ||
    results.drivers.length > 0 ||
    results.trips.length > 0 ||
    results.expenses.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[15vh] backdrop-blur-sm">
      <div
        ref={modalRef}
        className="flex w-full max-w-lg flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Header Search Field */}
        <div className="flex items-center border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Search className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search dashboard elements..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ml-3 flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:text-zinc-50 focus:ring-0"
          />
          <button
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[350px] overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2 text-sky-600" />
              <span className="text-sm font-medium">Searching...</span>
            </div>
          )}

          {!loading && query.trim().length >= 2 && !hasResults && (
            <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No results found for &ldquo;<span className="font-semibold">{query}</span>&rdquo;
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="py-8 text-center text-sm text-zinc-400">
              Start typing to search vehicles, drivers, trips, and expenses
            </div>
          )}

          {!loading && hasResults && (
            <div className="space-y-4">
              {/* Vehicles */}
              {results.vehicles.length > 0 && (
                <div>
                  <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                    Vehicles
                  </h3>
                  <div className="mt-1 space-y-0.5">
                    {results.vehicles.map((v) => (
                      <button
                        key={v._id}
                        onClick={() => handleSelect("/dashboard/vehicles")}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-zinc-700 hover:bg-sky-50/50 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
                      >
                        <Truck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {v.registrationNumber}
                          </div>
                          <div className="text-xs text-zinc-500">{v.name} ({v.type})</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Drivers */}
              {results.drivers.length > 0 && (
                <div>
                  <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                    Drivers
                  </h3>
                  <div className="mt-1 space-y-0.5">
                    {results.drivers.map((d) => (
                      <button
                        key={d._id}
                        onClick={() => handleSelect("/dashboard/drivers")}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-zinc-700 hover:bg-sky-50/50 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
                      >
                        <User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {d.name}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {d.phone} • {d.licenseNumber}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trips */}
              {results.trips.length > 0 && (
                <div>
                  <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                    Trips
                  </h3>
                  <div className="mt-1 space-y-0.5">
                    {results.trips.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => handleSelect("/dashboard/trips")}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-zinc-700 hover:bg-sky-50/50 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
                      >
                        <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {t.source} &rarr; {t.destination}
                          </div>
                          <div className="text-xs text-zinc-500">
                            Status: <span className="capitalize">{t.status}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses */}
              {results.expenses.length > 0 && (
                <div>
                  <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                    Expenses
                  </h3>
                  <div className="mt-1 space-y-0.5">
                    {results.expenses.map((e) => (
                      <button
                        key={e._id}
                        onClick={() => handleSelect("/dashboard/expenses")}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-zinc-700 hover:bg-sky-50/50 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
                      >
                        <DollarSign className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            ${e.amount.toLocaleString()} - {e.category}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {e.description} • {e.vehicleId?.registrationNumber}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
