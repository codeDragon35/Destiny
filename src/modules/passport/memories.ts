import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type Memory = {
  id: string;
  placeId: string | null;
  kind: "photo" | "note";
  imagePath: string | null;
  note: string | null;
};

export async function listMemories(tripId: string): Promise<Memory[]> {
  const rows = await db.execute<Memory>(sql`
    SELECT id, place_id AS "placeId", kind, image_path AS "imagePath", note
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
}) {
  const kind = input.imagePath ? "photo" : "note";
  await db.execute(sql`
    INSERT INTO memories (trip_id, user_id, place_id, kind, image_path, note)
    VALUES (
      ${input.tripId},
      ${input.userId},
      ${input.placeId},
      ${kind},
      ${input.imagePath},
      ${input.note}
    )
  `);
}

/** Deletes a memory only if it belongs to this user. */
export async function deleteMemory(id: string, userId: string) {
  await db.execute(sql`
    DELETE FROM memories WHERE id = ${id}::uuid AND user_id = ${userId}
  `);
}
