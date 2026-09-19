"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type MapRegion = {
  slug: string;
  name: string;
  kind: string;
  cityCount: number;
  placeCount: number;
  highlights: string[];
};

type Feature = {
  properties: { country: string; name: string; slug: string };
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
};

type Ring = [number, number][];

const W = 760;
const H = 620;
const PAD = 16;

/**
 * Clickable state map. Regions we have mapped are filled and navigate on click;
 * the rest stay faint, so the page shows what exists versus what is verified.
 */
export default function RegionMap({
  features,
  regions,
  countrySlug,
  accentHex,
}: {
  features: Feature[];
  regions: MapRegion[];
  countrySlug: string;
  accentHex: string;
}) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const bySlug = useMemo(
    () => new Map(regions.map((r) => [r.slug, r])),
    [regions],
  );

  const { paths, project } = useMemo(() => {
    const rings: { slug: string; name: string; rings: Ring[] }[] = features.map((f) => {
      const polys =
        f.geometry.type === "MultiPolygon"
          ? (f.geometry.coordinates as number[][][][])
          : [f.geometry.coordinates as number[][][]];
      return {
        slug: f.properties.slug,
        name: f.properties.name,
        rings: polys.map((poly) => poly[0] as Ring),
      };
    });

    const all = rings.flatMap((r) => r.rings.flat());
    const lngs = all.map((p) => p[0]);
    const lats = all.map((p) => p[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // Equirectangular corrected for latitude, as RouteMap does — without the
    // cosine the country stretches sideways the further it sits from the equator.
    const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
    const spanX = (maxLng - minLng) * Math.cos(midLat);
    const spanY = maxLat - minLat;
    const scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
    const offsetX = (W - spanX * scale) / 2;
    const offsetY = (H - spanY * scale) / 2;

    const projectPoint = (lng: number, lat: number): [number, number] => [
      offsetX + (lng - minLng) * Math.cos(midLat) * scale,
      offsetY + (maxLat - lat) * scale,
    ];

    return {
      project: projectPoint,
      paths: rings.map((r) => ({
        slug: r.slug,
        name: r.name,
        d: r.rings
          .map(
            (ring) =>
              "M" +
              ring
                .map((p) => projectPoint(p[0], p[1]).map((n) => n.toFixed(1)).join(","))
                .join("L") +
              "Z",
          )
          .join(" "),
      })),
    };
  }, [features]);

  void project;

  const active = hovered ? bySlug.get(hovered) : null;
  const activeName = paths.find((p) => p.slug === hovered)?.name;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onPointerMove={(e) => {
        const box = wrapRef.current?.getBoundingClientRect();
        if (box) setPointer({ x: e.clientX - box.left, y: e.clientY - box.top });
      }}
      onPointerLeave={() => setHovered(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Region map">
        {paths.map((path) => {
          const region = bySlug.get(path.slug);
          const mapped = (region?.placeCount ?? 0) > 0;
          const isHovered = hovered === path.slug;

          return (
            <path
              key={path.slug}
              d={path.d}
              className="cursor-pointer transition-[fill,stroke] duration-200"
              fill={
                isHovered && mapped
                  ? accentHex
                  : mapped
                    ? "rgba(122,138,94,0.55)"
                    : "rgba(192,182,165,0.28)"
              }
              stroke={isHovered ? "#173F35" : "rgba(23,63,53,0.35)"}
              strokeWidth={isHovered ? 1.6 : 0.6}
              onPointerEnter={() => setHovered(path.slug)}
              onClick={() => {
                if (region) router.push(`/country/${countrySlug}/region/${path.slug}`);
              }}
            />
          );
        })}
      </svg>

      {hovered && (
        <div
          // Animated in on every hover: keyed so it replays when the state changes.
          key={hovered}
          className="animate-float-in pointer-events-none absolute z-10 w-52 rounded-md border border-ink/10 bg-cream px-4 py-3 shadow-lg"
          style={{
            left: Math.min(pointer.x + 14, (wrapRef.current?.clientWidth ?? W) - 220),
            top: Math.max(0, pointer.y - 70),
          }}
        >
          <p className="font-display text-base text-forest">{active?.name ?? activeName}</p>
          {active ? (
            <>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-neutral-500">
                {active.kind}
              </p>
              {active.placeCount > 0 ? (
                <>
                  {active.highlights.length > 0 && (
                    <p className="mt-2 text-sm leading-snug text-neutral-700">
                      {active.highlights.join(" · ")}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-neutral-500">
                    {active.cityCount} {active.cityCount === 1 ? "city" : "cities"} ·{" "}
                    {active.placeCount} places
                  </p>
                  <p className="mt-1 text-xs" style={{ color: accentHex }}>
                    Click to explore →
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-neutral-600">Nothing mapped yet</p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-neutral-600">Not in this guide yet</p>
          )}
        </div>
      )}
    </div>
  );
}
