import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type RegionFeature = {
  properties: { country: string; name: string; slug: string };
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
};

/**
 * State/province outlines for one country, by its English name as Natural Earth
 * spells it. Countries absent from the dataset return [] and the page omits the map.
 */
export async function regionFeaturesFor(countryName: string): Promise<RegionFeature[]> {
  const file = path.join(process.cwd(), "public", "geo", "regions.geojson");
  try {
    const data = JSON.parse(await readFile(file, "utf8")) as {
      features: RegionFeature[];
    };
    return data.features.filter((f) => f.properties.country === countryName);
  } catch {
    return [];
  }
}
