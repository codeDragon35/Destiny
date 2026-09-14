import { sql } from "drizzle-orm";
import { client, db } from "./client";
import type { SeedCountry } from "./seed-data/types";
import china from "./seed-data/china";
import japan from "./seed-data/japan";
import india from "./seed-data/india";
import italy from "./seed-data/italy";

const COUNTRIES: SeedCountry[] = [china, japan, india, italy];

async function seedCountry(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  country: SeedCountry,
) {
  // Idempotent: cities, places, collectibles and events all cascade from the country row.
  await tx.execute(sql`DELETE FROM countries WHERE code = ${country.code}`);

  const [inserted] = await tx.execute<{ id: string }>(sql`
    INSERT INTO countries (code, name, slug, summary, emoji, wikidata_id, motif)
    VALUES (
      ${country.code},
      ${country.name},
      ${country.slug},
      ${country.summary},
      ${country.emoji},
      ${country.wikidataId},
      ${country.motif ?? null}
    )
    RETURNING id
  `);

  const regionIds = new Map<string, string>();
  for (const region of country.regions ?? []) {
    const [row] = await tx.execute<{ id: string }>(sql`
      INSERT INTO regions (country_id, name, slug, kind, summary, wikidata_id)
      VALUES (
        ${inserted.id},
        ${region.name},
        ${region.slug},
        ${region.kind},
        ${region.summary ?? null},
        ${region.wikidataId ?? null}
      )
      RETURNING id
    `);
    regionIds.set(region.slug, row.id);
  }

  for (const city of country.cities) {
    const [insertedCity] = await tx.execute<{ id: string }>(sql`
      INSERT INTO cities (country_id, region_id, name, slug, summary, location, wikidata_id)
      VALUES (
        ${inserted.id},
        ${city.region ? (regionIds.get(city.region) ?? null) : null},
        ${city.name},
        ${city.slug},
        ${city.summary},
        ST_SetSRID(ST_MakePoint(${city.lng}, ${city.lat}), 4326),
        ${city.wikidataId ?? null}
      )
      RETURNING id
    `);

    for (const place of city.places) {
      const [insertedPlace] = await tx.execute<{ id: string }>(sql`
        INSERT INTO places (
          city_id, name, slug, kind, summary, location, visit_minutes,
          wikidata_id, best_months, season_note
        )
        VALUES (
          ${insertedCity.id},
          ${place.name},
          ${place.slug},
          ${place.kind},
          ${place.summary},
          ST_SetSRID(ST_MakePoint(${place.lng}, ${place.lat}), 4326),
          ${place.visitMinutes},
          ${place.wikidataId ?? null},
          ${
            place.bestMonths
              ? sql`ARRAY[${sql.join(place.bestMonths.map((m) => sql`${m}`), sql`, `)}]::smallint[]`
              : null
          },
          ${place.seasonNote ?? null}
        )
        RETURNING id
      `);

      for (const ev of place.events ?? []) {
        await tx.execute(sql`
          INSERT INTO events (place_id, name, slug, description, start_month, start_day, end_month, end_day)
          VALUES (
            ${insertedPlace.id},
            ${ev.name},
            ${ev.slug},
            ${ev.description},
            ${ev.startMonth},
            ${ev.startDay ?? null},
            ${ev.endMonth ?? null},
            ${ev.endDay ?? null}
          )
        `);
      }

      for (const item of place.collectibles ?? []) {
        await tx.execute(sql`
          INSERT INTO collectibles (place_id, name, slug, kind, description, where_to_get, cost)
          VALUES (
            ${insertedPlace.id},
            ${item.name},
            ${item.slug},
            ${item.kind}::collectible_kind,
            ${item.description},
            ${item.whereToGet},
            ${item.cost ?? null}
          )
        `);
      }
    }
  }
}

async function main() {
  await db.transaction(async (tx) => {
    for (const country of COUNTRIES) await seedCountry(tx, country);
  });

  for (const country of COUNTRIES) {
    const places = country.cities.reduce((n, c) => n + c.places.length, 0);
    const regions = country.regions?.length ?? 0;
    const collectibles = country.cities.reduce(
      (n, c) => n + c.places.reduce((m, p) => m + (p.collectibles?.length ?? 0), 0),
      0,
    );
    const events = country.cities.reduce(
      (n, c) => n + c.places.reduce((m, p) => m + (p.events?.length ?? 0), 0),
      0,
    );
    console.log(
      `${country.emoji} ${country.name}: ${regions} regions, ${country.cities.length} cities, ` +
        `${places} places, ${collectibles} collectibles, ${events} events`,
    );
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
