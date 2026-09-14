import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type Country = {
  id: string;
  code: string;
  name: string;
  slug: string;
  summary: string | null;
  emoji: string | null;
  /** Centroid of the country's cities; null until cities are seeded. */
  lat: number | null;
  lng: number | null;
  wikidataId: string | null;
  motif: string | null;
  placeCount: number;
};

export type City = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  lat: number;
  lng: number;
  placeCount: number;
  wikidataId: string | null;
};

export type Place = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  summary: string | null;
  lat: number;
  lng: number;
  visitMinutes: number | null;
  wikidataId: string | null;
};

export async function listCountries(): Promise<Country[]> {
  const rows = await db.execute<Country>(sql`
    SELECT
      c.id,
      c.code,
      c.name,
      c.slug,
      c.summary,
      c.emoji,
      c.wikidata_id AS "wikidataId",
      c.motif,
      ST_Y(ST_Centroid(ST_Collect(ct.location))) AS lat,
      ST_X(ST_Centroid(ST_Collect(ct.location))) AS lng,
      (SELECT COUNT(*)::int FROM places p
       JOIN cities c2 ON c2.id = p.city_id WHERE c2.country_id = c.id) AS "placeCount"
    FROM countries c
    LEFT JOIN cities ct ON ct.country_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `);
  return [...rows];
}

export async function getCountryBySlug(slug: string): Promise<Country | null> {
  const rows = await db.execute<Country>(sql`
    SELECT
      c.id, c.code, c.name, c.slug, c.summary, c.emoji,
      c.wikidata_id AS "wikidataId", c.motif,
      (SELECT COUNT(*)::int FROM places p
       JOIN cities c2 ON c2.id = p.city_id WHERE c2.country_id = c.id) AS "placeCount"
    FROM countries c
    WHERE c.slug = ${slug}
    LIMIT 1
  `);
  return rows[0] ?? null;
}

export async function listCitiesForCountry(countryId: string): Promise<City[]> {
  const rows = await db.execute<City>(sql`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.summary,
      ST_Y(c.location) AS lat,
      ST_X(c.location) AS lng,
      c.wikidata_id AS "wikidataId",
      COUNT(p.id)::int AS "placeCount"
    FROM cities c
    LEFT JOIN places p ON p.city_id = c.id
    WHERE c.country_id = ${countryId}
    GROUP BY c.id
    ORDER BY c.name
  `);
  return [...rows];
}

export async function getCityBySlug(countryId: string, slug: string) {
  const rows = await db.execute<Omit<City, "placeCount">>(sql`
    SELECT
      id,
      name,
      slug,
      summary,
      ST_Y(location) AS lat,
      ST_X(location) AS lng,
      wikidata_id AS "wikidataId"
    FROM cities
    WHERE country_id = ${countryId} AND slug = ${slug}
    LIMIT 1
  `);
  return rows[0] ?? null;
}

export async function listPlacesForCity(cityId: string): Promise<Place[]> {
  const rows = await db.execute<Place>(sql`
    SELECT
      id,
      name,
      slug,
      kind,
      summary,
      ST_Y(location) AS lat,
      ST_X(location) AS lng,
      visit_minutes AS "visitMinutes",
      wikidata_id AS "wikidataId"
    FROM places
    WHERE city_id = ${cityId}
    ORDER BY name
  `);
  return [...rows];
}

/** Places within `radiusMeters` of a point, nearest first. Backs map-driven discovery. */
export async function listPlacesNear(
  lat: number,
  lng: number,
  radiusMeters = 50_000,
  limit = 20,
): Promise<(Place & { distanceMeters: number })[]> {
  const rows = await db.execute<Place & { distanceMeters: number }>(sql`
    SELECT
      id,
      name,
      slug,
      kind,
      summary,
      ST_Y(location) AS lat,
      ST_X(location) AS lng,
      visit_minutes AS "visitMinutes",
      ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) AS "distanceMeters"
    FROM places
    WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})
    ORDER BY "distanceMeters"
    LIMIT ${limit}
  `);
  return [...rows];
}

/** Hidden gems across all countries, for the home dashboard's taste row. */
export async function listHiddenPlaces(limit = 4) {
  const rows = await db.execute<{
    id: string;
    name: string;
    summary: string | null;
    kind: string;
    cityName: string;
    citySlug: string;
    countryName: string;
    countrySlug: string;
    wikidataId: string | null;
  }>(sql`
    SELECT
      p.id, p.name, p.summary, p.kind,
      p.wikidata_id AS "wikidataId",
      ct.name AS "cityName", ct.slug AS "citySlug",
      co.name AS "countryName", co.slug AS "countrySlug"
    FROM places p
    JOIN cities ct ON ct.id = p.city_id
    JOIN countries co ON co.id = ct.country_id
    WHERE p.kind = 'hidden_gem'
    ORDER BY random()
    LIMIT ${limit}
  `);
  return [...rows];
}
