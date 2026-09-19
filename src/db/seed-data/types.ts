export type SeedEvent = {
  name: string;
  slug: string;
  description: string;
  startMonth: number;
  startDay?: number;
  endMonth?: number;
  endDay?: number;
};

export type SeedCollectible = {
  name: string;
  slug: string;
  kind: "stamp" | "passport" | "souvenir" | "book" | "badge";
  description: string;
  whereToGet: string;
  cost?: number;
};

export type SeedActivity = {
  name: string;
  slug: string;
  summary: string;
  effort?: "easy" | "moderate" | "hard";
  minutes: number;
  cost?: number;
  bestTime?: string;
};

export type SeedPlace = {
  name: string;
  slug: string;
  wikidataId?: string;
  /** Months (1-12) genuinely worth visiting; omit when the place is year-round. */
  bestMonths?: number[];
  seasonNote?: string;
  events?: SeedEvent[];
  collectibles?: SeedCollectible[];
  /** Ways to do this place; the first is treated as the default. */
  activities?: SeedActivity[];
  kind: "attraction" | "nature" | "culture" | "food" | "hidden_gem";
  summary: string;
  lat: number;
  lng: number;
  visitMinutes: number;
};

export type SeedRegion = {
  name: string;
  slug: string;
  /** What the country calls this tier: state, province, prefecture, region. */
  kind: string;
  summary?: string;
  wikidataId?: string;
};

export type SeedCity = {
  name: string;
  slug: string;
  /** Slug of the region this city sits in; must match a SeedRegion. */
  region?: string;
  wikidataId?: string;
  summary: string;
  lat: number;
  lng: number;
  places: SeedPlace[];
};

export type SeedCountry = {
  code: string;
  name: string;
  slug: string;
  wikidataId: string;
  emoji: string;
  motif?: string;
  summary: string;
  /** States / provinces / prefectures. A country may list every one, even
   *  those with no cities seeded yet — browsing shows what exists. */
  regions?: SeedRegion[];
  cities: SeedCity[];
};
