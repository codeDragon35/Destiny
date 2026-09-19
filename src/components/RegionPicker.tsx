"use client";

import { useState } from "react";
import Link from "next/link";
import RegionMap, { type MapRegion } from "./RegionMap";

type Feature = {
  properties: { country: string; name: string; slug: string };
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
};

/**
 * Two ways to choose a region, one at a time: the map, or the full list.
 * Showing both at once made the page long and the list redundant.
 */
export default function RegionPicker({
  features,
  regions,
  countrySlug,
  accentHex,
  kind,
}: {
  features: Feature[];
  regions: MapRegion[];
  countrySlug: string;
  accentHex: string;
  kind: string;
}) {
  const hasMap = features.length > 0;
  const [view, setView] = useState<"map" | "list">(hasMap ? "map" : "list");

  const mapped = regions.filter((r) => r.placeCount > 0);
  const rest = regions.filter((r) => r.placeCount === 0);

  return (
    <div>
      {hasMap && (
        <div className="mt-6 inline-flex rounded-full border border-ink/10 bg-cream p-1 shadow-sm">
          {(["map", "list"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              aria-pressed={view === option}
              className={`rounded-full px-5 py-1.5 font-display text-sm transition ${
                view === option ? "text-cream" : "text-neutral-600 hover:text-forest"
              }`}
              style={view === option ? { backgroundColor: accentHex } : undefined}
            >
              {option === "map" ? "Map view" : "List view"}
            </button>
          ))}
        </div>
      )}

      {view === "map" && hasMap ? (
        <div className="mt-6 overflow-hidden rounded-md border border-ink/[0.08] bg-leaf-100 p-4 shadow-sm">
          <RegionMap
            features={features}
            regions={regions}
            countrySlug={countrySlug}
            accentHex={accentHex}
          />
          <p className="mt-2 text-center text-[11px] text-neutral-500">
            Hover a {kind} to see what is mapped there · click to explore
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...mapped, ...rest].map((region) => (
            <Link
              key={region.slug}
              href={`/country/${countrySlug}/region/${region.slug}`}
              className={`flex items-baseline justify-between gap-3 rounded-md border px-4 py-3 text-sm transition ${
                region.placeCount > 0
                  ? "border-ink/[0.08] bg-cream text-forest shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                  : "border-ink/[0.06] text-neutral-500 hover:border-ink/15"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate">{region.name}</span>
                {region.highlights.length > 0 && (
                  <span className="mt-0.5 block truncate text-xs text-neutral-500">
                    {region.highlights.join(" · ")}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs">
                {region.placeCount > 0 ? (
                  <span style={{ color: accentHex }}>{region.placeCount}</span>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
