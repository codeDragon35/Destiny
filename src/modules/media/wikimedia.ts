import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { cacheGet, cacheSet } from "./cache";

const UA = "DestinyTravelApp/0.1 (https://github.com/codeDragon35/Destiny)";
const REFRESH_AFTER_DAYS = 30;

export type Photo = { url: string; credit: string | null };

/** Table must be a literal: it is interpolated into SQL. */
type Table = "places" | "cities" | "countries";

function commonsUrl(file: string, width = 1600) {
  const name = encodeURIComponent(file.replace(/ /g, "_"));
  const direct = `https://commons.wikimedia.org/wiki/Special:FilePath/${name}?width=${width}`;
  // Proxied: Wikimedia returns a placeholder image to browsers hotlinking directly.
  return `/api/image?url=${encodeURIComponent(direct)}`;
}

async function wd<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function imageFileFor(qid: string) {
  // Wikidata P18 rarely changes; a week of caching keeps cold renders off the network.
  const cacheKey = `wd:p18:${qid}`;
  const cached = await cacheGet(cacheKey);
  if (cached !== null) return cached === "" ? null : cached;

  const data = await wd<{
    claims?: { P18?: { mainsnak: { datavalue?: { value: string } } }[] };
  }>(
    `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${qid}&property=P18&format=json&origin=*`,
  );
  const file = data?.claims?.P18?.[0]?.mainsnak?.datavalue?.value ?? null;
  await cacheSet(cacheKey, file ?? "", 604800);
  return file;
}

/**
 * Returns a Wikimedia Commons photo for one row, resolved at most once every
 * REFRESH_AFTER_DAYS. Results are cached in the row, so warm rows make no network call.
 * `wikidataId` skips the ambiguous search step entirely when known.
 */
export async function getPhoto(
  table: Table,
  id: string,
  _query: string,
  wikidataId?: string | null,
): Promise<Photo | null> {
  const rows = await db.execute<{
    image_url: string | null;
    image_credit: string | null;
    stale: boolean;
  }>(sql`
    SELECT
      image_url,
      image_credit,
      (photo_fetched_at IS NULL
        OR photo_fetched_at < now() - ${`${REFRESH_AFTER_DAYS} days`}::interval) AS stale
    FROM ${sql.raw(table)}
    WHERE id = ${id}
    LIMIT 1
  `);

  const row = rows[0];
  if (!row) return null;
  if (row.image_url && !row.stale) {
    return { url: row.image_url, credit: row.image_credit };
  }

  // Only ever resolve by explicit QID. Name search silently returns the wrong
  // subject — "Muslim Quarter" resolves to Jerusalem — and a confidently wrong
  // photo is worse than none.
  const qid = wikidataId ?? null;
  const file = qid ? await imageFileFor(qid) : null;

  if (!file) {
    // Record the attempt so a subject with no image is not retried on every render.
    await db.execute(sql`
      UPDATE ${sql.raw(table)} SET photo_fetched_at = now() WHERE id = ${id}
    `);
    return row.image_url ? { url: row.image_url, credit: row.image_credit } : null;
  }

  const url = commonsUrl(file);
  const credit = "Wikimedia Commons";

  await db.execute(sql`
    UPDATE ${sql.raw(table)}
    SET image_url = ${url}, image_credit = ${credit}, photo_fetched_at = now()
    WHERE id = ${id}
  `);

  return { url, credit };
}
