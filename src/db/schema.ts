import {
  geometry,
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
