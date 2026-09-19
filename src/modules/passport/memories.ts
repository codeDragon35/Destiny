import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type Memory = {
  id: string;
  placeId: string | null;
  kind: "photo" | "note";
  imagePath: string | null;
  note: string | null;
  tags: string[] | null;
  dayNumber: number | null;
  createdAt: string;
};

export async function listMemories(tripId: string): Promise<Memory[]> {
  const rows = await db.execute<Memory>(sql`
    SELECT
      id,
      place_id AS "placeId",
      kind,
      image_path AS "imagePath",
      note,
      tags,
      day_number AS "dayNumber",
      created_at AS "createdAt"
    FROM memories
    WHERE trip_id = ${tripId}
    ORDER BY created_at
  `);
  return [...rows];
}

export async function addMemory(input: {
  tripId: string;
  userId: string;
  placeId: string | null;
  imagePath: string | null;
  note: string | null;
  tags?: string[];
  dayNumber?: number | null;
}) {
  const kind = input.imagePath ? "photo" : "note";
  await db.execute(sql`
    INSERT INTO memories (trip_id, user_id, place_id, kind, image_path, note, tags, day_number)
    VALUES (
      ${input.tripId},
      ${input.userId},
      ${input.placeId},
      ${kind},
      ${input.imagePath},
      ${input.note},
      ${
        input.tags && input.tags.length > 0
          ? sql`ARRAY[${sql.join(input.tags.map((t) => sql`${t}`), sql`, `)}]::text[]`
          : null
      },
      ${input.dayNumber ?? null}
    )
  `);
}

/** Deletes a memory only if it belongs to this user. */
export async function deleteMemory(id: string, userId: string) {
  await db.execute(sql`
    DELETE FROM memories WHERE id = ${id}::uuid AND user_id = ${userId}
  `);
}
