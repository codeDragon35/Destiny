import { readFile } from "node:fs/promises";
import path from "node:path";

type Ring = [number, number][];
type Stop = { name: string; lat: number; lng: number; visited: boolean };

/** Country outline rings, in lng/lat degrees, for the given ISO alpha-2 code. */
async function countryRings(code: string): Promise<Ring[]> {
  const file = path.join(process.cwd(), "public", "geo", "countries.geojson");
  const data = JSON.parse(await readFile(file, "utf8")) as {
    features: {
      properties: { code: string };
      geometry: { type: string; coordinates: number[][][] | number[][][][] };
    }[];
  };

  const feature = data.features.find((f) => f.properties.code === code);
  if (!feature) return [];

  const polygons =
    feature.geometry.type === "MultiPolygon"
      ? (feature.geometry.coordinates as number[][][][])
      : [feature.geometry.coordinates as number[][][]];

  return polygons.map((poly) => poly[0] as Ring);
}

export default async function RouteMap({
  countryCode,
  stops,
}: {
  countryCode: string;
  stops: Stop[];
}) {
  const rings = await countryRings(countryCode);
  if (rings.length === 0 || stops.length === 0) return null;

  const W = 760;
  const H = 430;
  const PAD = 14;

  const lngs = rings.flat().map((p) => p[0]);
  const lats = rings.flat().map((p) => p[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  // Equirectangular, corrected for latitude so the country is not horizontally stretched.
  const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const spanX = (maxLng - minLng) * Math.cos(midLat);
  const spanY = maxLat - minLat;
  const scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);

  const offsetX = (W - spanX * scale) / 2;
  const offsetY = (H - spanY * scale) / 2;

  const project = (lng: number, lat: number): [number, number] => [
    offsetX + (lng - minLng) * Math.cos(midLat) * scale,
    // SVG y grows downward, latitude grows upward.
    offsetY + (maxLat - lat) * scale,
  ];

  const outline = rings
    .map(
      (ring) =>
        "M" +
        ring
          .map((p) => project(p[0], p[1]).map((n) => n.toFixed(1)).join(","))
          .join("L") +
        "Z",
    )
    .join(" ");

  const points = stops.map((s) => ({ ...s, xy: project(s.lng, s.lat) }));
  const route = points.map((p) => p.xy.map((n) => n.toFixed(1)).join(",")).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Route map: ${stops.map((s) => s.name).join(" to ")}`}
    >
      <path d={outline} fill="#CCDBB2" stroke="#173F35" strokeWidth={1} opacity={0.85} />

      {points.length > 1 && (
        <polyline
          points={route}
          fill="none"
          stroke="#C67139"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.85}
          className="route-line"
        />
      )}

      {points.map((p, i) => (
        <g key={p.name} className="route-stop" style={{ animationDelay: `${900 + i * 420}ms` }}>
          {p.visited && (
            <circle
              cx={p.xy[0]}
              cy={p.xy[1]}
              r={14}
              fill="none"
              stroke="#C67139"
              strokeWidth={1}
              opacity={0.4}
              className="sparkle"
              style={{ animationDelay: `${i * 500}ms` }}
            />
          )}
          <circle
            cx={p.xy[0]}
            cy={p.xy[1]}
            r={p.visited ? 7 : 5}
            fill={p.visited ? "#C67139" : "#FFF9ED"}
            stroke={p.visited ? "#C67139" : "#173F35"}
            strokeWidth={2}
          />
          <text
            x={p.xy[0]}
            y={p.xy[1] - 14}
            textAnchor="middle"
            className="fill-forest"
            style={{ fontSize: 15, fontWeight: 500 }}
          >
            {p.name}
          </text>
          <text
            x={p.xy[0]}
            y={p.xy[1] + 24}
            textAnchor="middle"
            style={{ fontSize: 11, fill: "#645C50" }}
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
