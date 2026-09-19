import { readFile } from "node:fs/promises";
import path from "node:path";
import JourneyMap from "./JourneyMap";

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

  // Projection and interaction live in the client component; this only loads
  // the geometry, which keeps the GeoJSON off the client bundle.
  return <JourneyMap rings={rings} stops={stops} />;
}
