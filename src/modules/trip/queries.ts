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
  userId: string | null;
  startDate: string | null;
};

export async function saveTrip(input: {
  countryId: string;
  slug: string;
  days: number;
  interests: string[];
  dietary: string | null;
  budget: number | null;
  plan: unknown;
  userId?: string | null;
  startDate?: string | null;
}) {
  await db.execute(sql`
    INSERT INTO trips (country_id, slug, days, interests, dietary, budget, plan, user_id, start_date)
    VALUES (
      ${input.countryId},
      ${input.slug},
      ${input.days},
      ${sql`ARRAY[${sql.join(input.interests.map((i) => sql`${i}`), sql`, `)}]::trip_interest[]`},
      ${input.dietary},
      ${input.budget},
      ${JSON.stringify(input.plan)}::jsonb,
      ${input.userId ?? null},
      ${input.startDate ?? null}::date
    )
  `);
}

export async function listTripsForUser(userId: string) {
  const rows = await db.execute<{
    slug: string;
    days: number;
    countryName: string;
    countryEmoji: string | null;
    createdAt: string;
    visited: number;
    collected: number;
  }>(sql`
    SELECT
      t.slug,
      t.days,
      c.name AS "countryName",
      c.emoji AS "countryEmoji",
      t.created_at AS "createdAt",
      COUNT(pr.place_id)::int AS visited,
      COUNT(pr.collectible_id)::int AS collected
    FROM trips t
    JOIN countries c ON c.id = t.country_id
    LEFT JOIN trip_progress pr ON pr.trip_id = t.id
    WHERE t.user_id = ${userId}
    GROUP BY t.id, c.name, c.emoji
    ORDER BY t.created_at DESC
  `);
  return [...rows];
}

export async function getTripBySlug(slug: string): Promise<SavedTrip | null> {
  const rows = await db.execute<SavedTrip>(sql`
    SELECT
      t.id, t.slug, t.days, t.interests, t.dietary, t.budget, t.plan,
      t.user_id AS "userId",
      t.start_date AS "startDate",
      c.name AS "countryName", c.slug AS "countrySlug"
    FROM trips t
    JOIN countries c ON c.id = t.country_id
    WHERE t.slug = ${slug}
    LIMIT 1
  `);
  return rows[0] ?? null;
}
