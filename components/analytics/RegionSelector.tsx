"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

export function RegionSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRegion = searchParams.get("region") || "All";

  const handleRegionChange = (newRegion: string) => {
    const params = new URLSearchParams(window.location.search);
    if (newRegion === "All") {
      params.delete("region");
    } else {
      params.set("region", newRegion);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Region Filter:
      </span>
      <select
        value={currentRegion}
        onChange={(e) => handleRegionChange(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 cursor-pointer"
      >
        <option value="All">All Regions</option>
        <option value="North">North</option>
        <option value="South">South</option>
        <option value="East">East</option>
        <option value="West">West</option>
        <option value="Central">Central</option>
      </select>
    </div>
  );
}
