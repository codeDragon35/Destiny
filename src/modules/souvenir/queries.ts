import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type Collectible = {
  id: string;
  placeId: string;
  placeName: string;
  name: string;
  slug: string;
  kind: string;
  description: string | null;
  whereToGet: string | null;
  cost: number | null;
};

export async function listCollectiblesForCity(cityId: string): Promise<Collectible[]> {
  const rows = await db.execute<Collectible>(sql`
    SELECT
      c.id,
      c.place_id AS "placeId",
      p.name AS "placeName",
      c.name,
      c.slug,
      c.kind,
      c.description,
      c.where_to_get AS "whereToGet",
      c.cost
    FROM collectibles c
    JOIN places p ON p.id = c.place_id
    WHERE p.city_id = ${cityId}
    ORDER BY p.name, c.name
  `);
  return [...rows];
}

export async function listCollectiblesForCountry(countryId: string): Promise<Collectible[]> {
  const rows = await db.execute<Collectible>(sql`
    SELECT
      c.id,
      c.place_id AS "placeId",
      p.name AS "placeName",
      c.name,
      c.slug,
      c.kind,
      c.description,
      c.where_to_get AS "whereToGet",
      c.cost
    FROM collectibles c
    JOIN places p ON p.id = c.place_id
    JOIN cities ct ON ct.id = p.city_id
    WHERE ct.country_id = ${countryId}
    ORDER BY ct.name, p.name
  `);
  return [...rows];
}

/** Collectibles for a set of places, keyed by place id. Used by itineraries. */
export async function collectiblesByPlaceIds(
  placeIds: string[],
): Promise<Map<string, Collectible[]>> {
  if (placeIds.length === 0) return new Map();

  const rows = await db.execute<Collectible>(sql`
    SELECT
      c.id,
      c.place_id AS "placeId",
      p.name AS "placeName",
      c.name,
      c.slug,
      c.kind,
      c.description,
      c.where_to_get AS "whereToGet",
      c.cost
    FROM collectibles c
    JOIN places p ON p.id = c.place_id
    WHERE c.place_id IN (${sql.join(placeIds.map((id) => sql`${id}::uuid`), sql`, `)})
    ORDER BY c.name
  `);

  const map = new Map<string, Collectible[]>();
  for (const row of rows) {
    const list = map.get(row.placeId) ?? [];
    list.push(row);
    map.set(row.placeId, list);
  }
  return map;
}
