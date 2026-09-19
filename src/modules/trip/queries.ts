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
  /** Activities the traveller chose, so the itinerary can name them. */
  activityIds: string[] | null;
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
  placeIds?: string[];
  activityIds?: string[];
}) {
  await db.execute(sql`
    INSERT INTO trips (country_id, slug, days, interests, dietary, budget, plan, user_id, start_date, place_ids, activity_ids)
    VALUES (
      ${input.countryId},
      ${input.slug},
      ${input.days},
      ${sql`ARRAY[${sql.join(input.interests.map((i) => sql`${i}`), sql`, `)}]::trip_interest[]`},
      ${input.dietary},
      ${input.budget},
      ${JSON.stringify(input.plan)}::jsonb,
      ${input.userId ?? null},
      ${input.startDate ?? null}::date,
      ${
        input.placeIds && input.placeIds.length > 0
          ? sql`ARRAY[${sql.join(input.placeIds.map((id) => sql`${id}::uuid`), sql`, `)}]`
          : null
      },
      ${
        input.activityIds && input.activityIds.length > 0
          ? sql`ARRAY[${sql.join(input.activityIds.map((id) => sql`${id}::uuid`), sql`, `)}]`
          : null
      }
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
      t.activity_ids AS "activityIds",
      t.start_date AS "startDate",
      c.name AS "countryName", c.slug AS "countrySlug"
    FROM trips t
    JOIN countries c ON c.id = t.country_id
    WHERE t.slug = ${slug}
    LIMIT 1
  `);
  return rows[0] ?? null;
}

/** Most recent unfinished trip for the "continue planning" card. */
export async function latestTripForUser(userId: string) {
  const rows = await db.execute<{
    slug: string;
    days: number;
    countryName: string;
    countrySlug: string;
    visited: number;
    totalPlaces: number;
  }>(sql`
    SELECT
      t.slug,
      t.days,
      c.name AS "countryName",
      c.slug AS "countrySlug",
      COUNT(pr.place_id)::int AS visited,
      COALESCE(jsonb_array_length(t.plan -> 'days'), 0)::int AS "totalPlaces"
    FROM trips t
    JOIN countries c ON c.id = t.country_id
    LEFT JOIN trip_progress pr ON pr.trip_id = t.id
    WHERE t.user_id = ${userId}
    GROUP BY t.id, c.name, c.slug
    ORDER BY t.created_at DESC
    LIMIT 1
  `);
  return rows[0] ?? null;
}

/** Stamp totals across every trip a user owns. */
export async function passportSummary(userId: string) {
  const rows = await db.execute<{ stamps: number; countries: number }>(sql`
    SELECT
      COUNT(pr.collectible_id)::int AS stamps,
      COUNT(DISTINCT t.country_id)::int AS countries
    FROM trips t
    LEFT JOIN trip_progress pr ON pr.trip_id = t.id
    WHERE t.user_id = ${userId}
  `);
  return rows[0] ?? { stamps: 0, countries: 0 };
}

/**
 * Regions actually covered by a trip's places, so the passport can title and
 * chapter itself by where the traveller really went rather than by country.
 */
export async function regionsForPlaces(placeIds: string[]) {
  if (placeIds.length === 0) return new Map<string, string>();

  const rows = await db.execute<{ placeId: string; regionName: string | null }>(sql`
    SELECT p.id AS "placeId", r.name AS "regionName"
    FROM places p
    JOIN cities ct ON ct.id = p.city_id
    LEFT JOIN regions r ON r.id = ct.region_id
    WHERE p.id IN (${sql.join(placeIds.map((id) => sql`${id}::uuid`), sql`, `)})
  `);

  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.regionName) map.set(row.placeId, row.regionName);
  }
  return map;
}
