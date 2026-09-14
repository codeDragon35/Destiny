"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GlobeGL, { type GlobeMethods } from "react-globe.gl";
import { MeshPhongMaterial } from "three";

type CountryFeature = {
  properties: { code: string; name: string };
};

export type GlobeCountry = { code: string; slug: string; lat: number; lng: number };

const SPACE = "#E1EECC";
const JADE = "#173F35";
const MIDNIGHT = "#CCDBB2";
const SOFT_GRAY = "#645C50";

export default function Globe({ available }: { available: GlobeCountry[] }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | null>(null);
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [hovered, setHovered] = useState<CountryFeature | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Must be a real Material: react-globe.gl calls .dispose() on unmount.
  const globeMaterial = useMemo(
    () => new MeshPhongMaterial({ color: MIDNIGHT, opacity: 0.98, transparent: true }),
    [],
  );

  const slugByCode = useMemo(
    () => new Map(available.map((c) => [c.code, c.slug])),
    [available],
  );

  useEffect(() => {
    fetch("/geo/countries.geojson")
      .then((r) => r.json())
      .then((d) => setFeatures(d.features))
      .catch(() => setFeatures([]));
  }, []);

  // Globe needs explicit pixel dimensions; it cannot size itself from CSS.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Open facing a country the user can actually explore, not the 0/0 default.
  const focusFirstCountry = useCallback(() => {
    const first = available[0];
    if (!first || !globeRef.current) return;
    globeRef.current.pointOfView({ lat: first.lat, lng: first.lng, altitude: 2.1 }, 0);
  }, [available]);

  const isAvailable = (f: CountryFeature) => slugByCode.has(f.properties.code);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      {size.width > 0 && (
        <GlobeGL
          ref={globeRef as never}
          onGlobeReady={focusFirstCountry}
          width={size.width}
          height={size.height}
          backgroundColor={SPACE}
          showAtmosphere
          atmosphereColor={JADE}
          atmosphereAltitude={0.18}
          showGlobe
          globeMaterial={globeMaterial}
          polygonsData={features}
          polygonCapColor={(f) => {
            const feat = f as CountryFeature;
            if (feat === hovered) return isAvailable(feat) ? "#C67139" : "rgba(100,92,80,0.35)";
            return isAvailable(feat) ? "rgba(23,63,53,0.78)" : "rgba(100,92,80,0.16)";
          }}
          polygonSideColor={() => "rgba(23,63,53,0.35)"}
          polygonStrokeColor={(f) =>
            isAvailable(f as CountryFeature) ? "#173F35" : "rgba(100,92,80,0.25)"
          }
          polygonAltitude={(f) => (f === hovered ? 0.06 : 0.01)}
          onPolygonHover={(f) => setHovered((f as CountryFeature) ?? null)}
          onPolygonClick={(f) => {
            const slug = slugByCode.get((f as CountryFeature).properties.code);
            if (slug) router.push(`/country/${slug}`);
          }}
          polygonLabel={() => ""}
        />
      )}

      {hovered && (
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-ink/10 bg-cream/95 px-5 py-2 shadow-sm">
          <span className="text-forest">{hovered.properties.name}</span>
          <span
            className="ml-3 text-xs"
            style={{ color: isAvailable(hovered) ? JADE : SOFT_GRAY }}
          >
            {isAvailable(hovered) ? "Explore →" : "Coming soon"}
          </span>
        </div>
      )}
    </div>
  );
}
