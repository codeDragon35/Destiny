import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type Progress = { places: Set<string>; collectibles: Set<string> };

export async function getProgress(tripId: string): Promise<Progress> {
  const rows = await db.execute<{ place_id: string | null; collectible_id: string | null }>(sql`
    SELECT place_id, collectible_id FROM trip_progress WHERE trip_id = ${tripId}
  `);

  const places = new Set<string>();
  const collectibles = new Set<string>();
  for (const row of rows) {
    if (row.place_id) places.add(row.place_id);
    if (row.collectible_id) collectibles.add(row.collectible_id);
  }
  return { places, collectibles };
}

/** Replaces a trip's whole selection in one transaction. */
export async function setProgress(
  tripId: string,
  placeIds: string[],
  collectibleIds: string[],
) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`DELETE FROM trip_progress WHERE trip_id = ${tripId}`);

    for (const id of placeIds) {
      await tx.execute(sql`
        INSERT INTO trip_progress (trip_id, place_id) VALUES (${tripId}, ${id}::uuid)
      `);
    }
    for (const id of collectibleIds) {
      await tx.execute(sql`
        INSERT INTO trip_progress (trip_id, collectible_id) VALUES (${tripId}, ${id}::uuid)
      `);
    }
  });
}

/** Ticks an item on or off. `kind` decides which column the id lands in. */
export async function toggleProgress(
  tripId: string,
  kind: "place" | "collectible",
  id: string,
) {
  const column = kind === "place" ? sql`place_id` : sql`collectible_id`;

  const existing = await db.execute<{ id: string }>(sql`
    SELECT id FROM trip_progress WHERE trip_id = ${tripId} AND ${column} = ${id}::uuid LIMIT 1
  `);

  if (existing[0]) {
    await db.execute(sql`DELETE FROM trip_progress WHERE id = ${existing[0].id}`);
    return false;
  }

  await db.execute(sql`
    INSERT INTO trip_progress (trip_id, ${column}) VALUES (${tripId}, ${id}::uuid)
  `);
  return true;
}
