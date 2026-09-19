"use client";

import { useMemo, useRef, useState } from "react";

export type MapStop = {
  name: string;
  lat: number;
  lng: number;
  visited: boolean;
};

type Ring = [number, number][];

const W = 760;
const H = 460;
const PAD = 24;

/**
 * The journey drawn on the country outline, with zoom. Geometry is projected
 * once for the whole country; zooming moves the SVG viewBox rather than
 * reprojecting, so panning stays cheap and the stroke widths hold up.
 */
export default function JourneyMap({
  rings,
  stops,
}: {
  rings: Ring[];
  stops: MapStop[];
}) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  const { outline, points, tripBox } = useMemo(() => {
    const all = rings.flat();
    const lngs = all.map((p) => p[0]);
    const lats = all.map((p) => p[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // Equirectangular corrected for latitude, so the country is not stretched.
    const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
    const spanX = (maxLng - minLng) * Math.cos(midLat);
    const spanY = maxLat - minLat;
    const scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
    const offsetX = (W - spanX * scale) / 2;
    const offsetY = (H - spanY * scale) / 2;

    const project = (lng: number, lat: number): [number, number] => [
      offsetX + (lng - minLng) * Math.cos(midLat) * scale,
      offsetY + (maxLat - lat) * scale,
    ];

    const projected = stops.map((s) => ({ ...s, xy: project(s.lng, s.lat) }));
    const xs = projected.map((p) => p.xy[0]);
    const ys = projected.map((p) => p.xy[1]);

    return {
      outline: rings
        .map(
          (ring) =>
            "M" +
            ring.map((p) => project(p[0], p[1]).map((n) => n.toFixed(1)).join(",")).join("L") +
            "Z",
        )
        .join(" "),
      points: projected,
      tripBox: {
        cx: (Math.min(...xs) + Math.max(...xs)) / 2,
        cy: (Math.min(...ys) + Math.max(...ys)) / 2,
        // How much of the frame the trip fills, used for the initial zoom.
        span: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)),
      },
    };
  }, [rings, stops]);

  // Open framed on the journey, not the whole country — a one-state trip on a
  // full-country map is a dot in an empty panel.
  const initialZoom = useMemo(() => {
    const target = Math.min(W, H) * 0.45;
    if (tripBox.span < 1) return 4;
    return Math.min(6, Math.max(1, target / tripBox.span));
  }, [tripBox.span]);

  const effectiveZoom = zoom === 1 ? initialZoom : zoom;
  const focus = center ?? { x: tripBox.cx, y: tripBox.cy };

  const viewW = W / effectiveZoom;
  const viewH = H / effectiveZoom;
  // Keep the frame inside the projected country so panning cannot lose the map.
  const vx = Math.min(Math.max(focus.x - viewW / 2, -PAD), W + PAD - viewW);
  const vy = Math.min(Math.max(focus.y - viewH / 2, -PAD), H + PAD - viewH);

  const stroke = 1 / effectiveZoom;
  const markerR = 6 / Math.sqrt(effectiveZoom);
  const fontSize = 14 / Math.sqrt(effectiveZoom);

  function zoomBy(factor: number) {
    setCenter(focus);
    setZoom((z) => Math.min(8, Math.max(1.05, (z === 1 ? initialZoom : z) * factor)));
  }

  return (
    <div className="relative">
      <svg
        viewBox={`${vx} ${vy} ${viewW} ${viewH}`}
        className="h-auto w-full cursor-grab touch-none active:cursor-grabbing"
        role="img"
        aria-label={`Journey map: ${stops.map((s) => s.name).join(" to ")}`}
        onPointerDown={(e) => {
          dragRef.current = { x: e.clientX, y: e.clientY, cx: focus.x, cy: focus.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          const box = e.currentTarget.getBoundingClientRect();
          // Convert pixel movement into viewBox units so drag tracks the cursor.
          const perPx = viewW / box.width;
          setCenter({
            x: d.cx - (e.clientX - d.x) * perPx,
            y: d.cy - (e.clientY - d.y) * perPx,
          });
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      >
        <path
          d={outline}
          fill="#CCDBB2"
          stroke="#173F35"
          strokeWidth={stroke}
          opacity={0.9}
          vectorEffect="non-scaling-stroke"
        />

        {points.length > 1 && (
          <polyline
            points={points.map((p) => p.xy.join(",")).join(" ")}
            fill="none"
            stroke="#C67139"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="7 6"
            vectorEffect="non-scaling-stroke"
            opacity={0.9}
          />
        )}

        {points.map((p, i) => {
          // Nearby stops would print their labels on top of each other, so
          // alternate sides and draw a short leader to the marker.
          const crowded = points.some(
            (q, j) =>
              j !== i && Math.hypot(q.xy[0] - p.xy[0], q.xy[1] - p.xy[1]) < fontSize * 4,
          );
          const above = !crowded || i % 2 === 0;
          const labelY = above
            ? p.xy[1] - markerR - (crowded ? fontSize * 1.6 : 6)
            : p.xy[1] + markerR + (crowded ? fontSize * 2.1 : fontSize);

          return (
          <g key={p.name}>
            {p.visited && (
              <circle cx={p.xy[0]} cy={p.xy[1]} r={markerR * 2} fill="#C67139" opacity={0.18} />
            )}
            <circle
              cx={p.xy[0]}
              cy={p.xy[1]}
              r={markerR}
              fill={p.visited ? "#C67139" : "#FFF9ED"}
              stroke={p.visited ? "#C67139" : "#173F35"}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            {crowded && (
              <line
                x1={p.xy[0]}
                y1={p.xy[1] + (above ? -markerR : markerR)}
                x2={p.xy[0]}
                y2={above ? labelY + fontSize * 0.3 : labelY - fontSize}
                stroke="#173F35"
                strokeWidth={1}
                opacity={0.35}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <text
              x={p.xy[0]}
              y={labelY}
              textAnchor="middle"
              style={{ fontSize, fontWeight: 500, paintOrder: "stroke" }}
              stroke="#F7F2E6"
              strokeWidth={fontSize * 0.28}
              strokeLinejoin="round"
              className="fill-forest"
            >
              {p.name}
            </text>
            {points.length > 1 && (
              <text
                x={p.xy[0] + markerR + fontSize * 0.5}
                y={p.xy[1] + fontSize * 0.35}
                style={{ fontSize: fontSize * 0.72, paintOrder: "stroke" }}
                stroke="#F7F2E6"
                strokeWidth={fontSize * 0.22}
                strokeLinejoin="round"
                className="fill-neutral-600"
              >
                {i + 1}
              </text>
            )}
          </g>
          );
        })}
      </svg>

      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-md border border-ink/10 bg-cream shadow-sm print:hidden">
        <button
          type="button"
          onClick={() => zoomBy(1.5)}
          aria-label="Zoom in"
          className="px-2.5 py-1.5 text-forest transition hover:bg-surface"
        >
          +
        </button>
        <span className="h-px bg-ink/10" />
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.5)}
          aria-label="Zoom out"
          className="px-2.5 py-1.5 text-forest transition hover:bg-surface"
        >
          −
        </button>
        <span className="h-px bg-ink/10" />
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setCenter(null);
          }}
          aria-label="Reset view"
          className="px-2.5 py-1.5 text-xs text-neutral-600 transition hover:bg-surface"
        >
          ⌂
        </button>
      </div>

      <p className="mt-2 text-center text-[11px] text-neutral-500 print:hidden">
        Drag to pan · use + and − to zoom
      </p>
    </div>
  );
}
