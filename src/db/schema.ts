import {
  geometry,
  jsonb,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Coordinates are stored as PostGIS geometry(Point,4326) in [lng, lat] order.
 * Distance/radius queries cast to ::geography so results come back in metres.
 */
const point = (name: string) => geometry(name, { type: "point", srid: 4326 });

export const tripInterest = pgEnum("trip_interest", [
  "nature",
  "culture",
  "food",
  "hidden_gem",
]);

export const collectibleKind = pgEnum("collectible_kind", [
  "stamp",
  "passport",
  "souvenir",
  "book",
  "badge",
]);

export const placeKind = pgEnum("place_kind", [
  "attraction",
  "nature",
  "culture",
  "food",
  "hidden_gem",
]);

export const countries = pgTable(
  "countries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // ISO 3166-1 alpha-2, e.g. "CN".
    code: text("code").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary"),
    emoji: text("emoji"),
    imageUrl: text("image_url"),
    imageCredit: text("image_credit"),
    // Exact Wikidata entity; avoids ambiguous name search when resolving photos.
    wikidataId: text("wikidata_id"),
    photoFetchedAt: timestamp("photo_fetched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("countries_code_idx").on(t.code),
    uniqueIndex("countries_slug_idx").on(t.slug),
  ],
);

export const cities = pgTable(
  "cities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary"),
    location: point("location").notNull(),
    imageUrl: text("image_url"),
    imageCredit: text("image_credit"),
    // Exact Wikidata entity; avoids ambiguous name search when resolving photos.
    wikidataId: text("wikidata_id"),
    photoFetchedAt: timestamp("photo_fetched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("cities_country_slug_idx").on(t.countryId, t.slug),
    index("cities_location_idx").using("gist", t.location),
  ],
);

export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    kind: placeKind("kind").notNull(),
    summary: text("summary"),
    location: point("location").notNull(),
    imageUrl: text("image_url"),
    imageCredit: text("image_credit"),
    // Exact Wikidata entity; avoids ambiguous name search when resolving photos.
    wikidataId: text("wikidata_id"),
    photoFetchedAt: timestamp("photo_fetched_at", { withTimezone: true }),
    // Typical visit length, used later by the Trip Planner Agent for day packing.
    visitMinutes: integer("visit_minutes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("places_city_slug_idx").on(t.cityId, t.slug),
    index("places_location_idx").using("gist", t.location),
    index("places_kind_idx").on(t.kind),
  ],
);

export const trips = pgTable(
  "trips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    days: integer("days").notNull(),
    interests: tripInterest("interests").array().notNull(),
    dietary: text("dietary"),
    budget: integer("budget"),
    /** Generated plan: [{ day, placeIds[] }]. Denormalised so a saved trip is stable. */
    plan: jsonb("plan").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("trips_slug_idx").on(t.slug)],
);

export const collectibles = pgTable(
  "collectibles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    kind: collectibleKind("kind").notNull(),
    description: text("description"),
    /** Where to physically obtain it, e.g. "Visitor centre, east gate". */
    whereToGet: text("where_to_get"),
    /** Local currency minor units; null when free. */
    cost: integer("cost"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("collectibles_place_slug_idx").on(t.placeId, t.slug),
    index("collectibles_kind_idx").on(t.kind),
  ],
);

/** One row per thing ticked off on a trip: either a place visited or a collectible obtained. */
export const tripProgress = pgTable(
  "trip_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    placeId: uuid("place_id").references(() => places.id, { onDelete: "cascade" }),
    collectibleId: uuid("collectible_id").references(() => collectibles.id, {
      onDelete: "cascade",
    }),
    collectedAt: timestamp("collected_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("trip_progress_place_idx").on(t.tripId, t.placeId),
    uniqueIndex("trip_progress_collectible_idx").on(t.tripId, t.collectibleId),
  ],
);
