import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { PlannedDay } from "./planner";

export type SavedTrip = {
  id: string;
  slug: string;
  days: number;
  interests: string[];
  dietary: string | null;
  budget: number | null;
  plan: { days: PlannedDay[]; unfilledDays: number };
  countryName: string;
  countrySlug: string;
};

export async function saveTrip(input: {
  countryId: string;
  slug: string;
  days: number;
  interests: string[];
  dietary: string | null;
  budget: number | null;
  plan: unknown;
}) {
  await db.execute(sql`
    INSERT INTO trips (country_id, slug, days, interests, dietary, budget, plan)
    VALUES (
      ${input.countryId},
      ${input.slug},
      ${input.days},
      ${sql`ARRAY[${sql.join(input.interests.map((i) => sql`${i}`), sql`, `)}]::trip_interest[]`},
      ${input.dietary},
      ${input.budget},
      ${JSON.stringify(input.plan)}::jsonb
    )
  `);
}

export async function getTripBySlug(slug: string): Promise<SavedTrip | null> {
  const rows = await db.execute<SavedTrip>(sql`
    SELECT
      t.id, t.slug, t.days, t.interests, t.dietary, t.budget, t.plan,
      c.name AS "countryName", c.slug AS "countrySlug"
    FROM trips t
    JOIN countries c ON c.id = t.country_id
    WHERE t.slug = ${slug}
    LIMIT 1
  `);
  return rows[0] ?? null;
}
