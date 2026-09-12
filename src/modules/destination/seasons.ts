import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type PlaceEvent = {
  id: string;
  placeId: string;
  placeName: string;
  name: string;
  description: string | null;
  startMonth: number;
  endMonth: number | null;
};

export type Seasonality = {
  placeId: string;
  bestMonths: number[] | null;
  seasonNote: string | null;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthName(month: number) {
  return MONTHS[month - 1] ?? "";
}

/** Formats a month range as "October–November", or a single month. */
export function formatRange(startMonth: number, endMonth: number | null) {
  if (!endMonth || endMonth === startMonth) return monthName(startMonth);
  return `${monthName(startMonth)}–${monthName(endMonth)}`;
}

/** True when `month` falls in the range. Handles ranges that wrap the new year, e.g. Dec-Feb. */
export function monthInRange(month: number, startMonth: number, endMonth: number | null) {
  const end = endMonth ?? startMonth;
  return startMonth <= end
    ? month >= startMonth && month <= end
    : month >= startMonth || month <= end;
}

export async function seasonalityForPlaces(placeIds: string[]) {
  if (placeIds.length === 0) return new Map<string, Seasonality>();

  const rows = await db.execute<Seasonality>(sql`
    SELECT id AS "placeId", best_months AS "bestMonths", season_note AS "seasonNote"
    FROM places
    WHERE id IN (${sql.join(placeIds.map((id) => sql`${id}::uuid`), sql`, `)})
  `);
  return new Map(rows.map((row) => [row.placeId, row]));
}

export async function eventsForPlaces(placeIds: string[]) {
  if (placeIds.length === 0) return new Map<string, PlaceEvent[]>();

  const rows = await db.execute<PlaceEvent>(sql`
    SELECT
      e.id,
      e.place_id AS "placeId",
      p.name AS "placeName",
      e.name,
      e.description,
      e.start_month AS "startMonth",
      e.end_month AS "endMonth"
    FROM events e
    JOIN places p ON p.id = e.place_id
    WHERE e.place_id IN (${sql.join(placeIds.map((id) => sql`${id}::uuid`), sql`, `)})
    ORDER BY e.start_month
  `);

  const map = new Map<string, PlaceEvent[]>();
  for (const row of rows) {
    const list = map.get(row.placeId) ?? [];
    list.push(row);
    map.set(row.placeId, list);
  }
  return map;
}

export async function eventsForCity(cityId: string): Promise<PlaceEvent[]> {
  const rows = await db.execute<PlaceEvent>(sql`
    SELECT
      e.id,
      e.place_id AS "placeId",
      p.name AS "placeName",
      e.name,
      e.description,
      e.start_month AS "startMonth",
      e.end_month AS "endMonth"
    FROM events e
    JOIN places p ON p.id = e.place_id
    WHERE p.city_id = ${cityId}
    ORDER BY e.start_month
  `);
  return [...rows];
}
