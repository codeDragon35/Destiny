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

export type SeedPlace = {
  name: string;
  slug: string;
  wikidataId?: string;
  /** Months (1-12) genuinely worth visiting; omit when the place is year-round. */
  bestMonths?: number[];
  seasonNote?: string;
  events?: SeedEvent[];
  collectibles?: SeedCollectible[];
  kind: "attraction" | "nature" | "culture" | "food" | "hidden_gem";
  summary: string;
  lat: number;
  lng: number;
  visitMinutes: number;
};

export type SeedCity = {
  name: string;
  slug: string;
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
  cities: SeedCity[];
};
