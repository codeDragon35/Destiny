import type { PlannedDay } from "./planner";

/**
 * Phrasing for the planning conversation. There is no LLM — replies are composed
 * from the deterministic plan, so every number shown is one the planner actually
 * produced. Keeps the screen honest while reading as a conversation.
 */
export type GuideChip = {
  label: string;
  /** Query string appended to the planner link; empty means the plain planner. */
  param: string;
};

export type GuideReply = {
  text: string;
  chips: GuideChip[];
};

/** Rough split of a budget, used to show where money goes. */
export function budgetSplit(total: number) {
  return [
    { label: "Flights", share: 0.34 },
    { label: "Stays", share: 0.26 },
    { label: "Rail & local", share: 0.22 },
    { label: "Food & entry", share: 0.18 },
  ].map((row) => ({ ...row, amount: Math.round(total * row.share) }));
}

/**
 * Refinements that actually change the plan. Each is a link back into the
 * planner with the relevant control pre-set, rather than a decorative pill.
 */
function buildChips(days: PlannedDay[], cities: string[]): GuideChip[] {
  const chips: GuideChip[] = [
    { label: "Make it slower", param: `days=${days.length + 2}` },
    { label: "Make it shorter", param: `days=${Math.max(1, days.length - 1)}` },
  ];
  if (cities.length > 1) {
    chips.push({ label: "Fewer places", param: `city=${slugify(cities[0])}` });
  }
  chips.push({ label: "Change what I like", param: "" });
  return chips;
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function summarise(days: PlannedDay[], interests: string[]): GuideReply {
  const cities = [...new Set(days.map((d) => d.cityName))];
  const placeCount = days.reduce((n, d) => n + d.places.length, 0);
  // Count outdoor *places*, not days — the sentence says "places", and counting
  // days here reported "2 of them" for a trip with one outdoor stop.
  const outdoorPlaces = days
    .flatMap((d) => d.places)
    .filter((p) => p.kind === "nature" || p.kind === "hidden_gem").length;

  const route = cities.join(" → ");
  const shape = interests.includes("nature")
    ? "walks in the morning and slower afternoons"
    : "the big sights early, before the crowds";

  return {
    text:
      `Then let's keep you off the rush. I've built a ${days.length}-day loop through ${route}, ` +
      `with ${shape}. That's ${placeCount} places across ${cities.length} ` +
      `${cities.length === 1 ? "base" : "bases"}` +
      (outdoorPlaces > 0 ? `, ${outdoorPlaces} of them outdoors.` : "."),
    chips: buildChips(days, cities),
  };
}

export type GuideView = {
  reply: GuideReply;
  asked: string;
  cities: string[];
  placeCount: number;
  hiddenNames: string[];
  /** What the planner actually chose, so the guide can name it rather than count it. */
  chosen: { day: number; cityName: string; places: string[] }[];
  split: { label: string; amount: number }[];
  pace: "Unhurried" | "Full";
};

/**
 * Everything both guide surfaces render. Shared so the side panel and the
 * full page can never drift apart.
 */
export function guideView(trip: {
  days: number;
  budget: number | null;
  dietary: string | null;
  interests: string[];
  plan: { days: PlannedDay[] };
}): GuideView {
  const days = trip.plan.days ?? [];
  const cities = [...new Set(days.map((d) => d.cityName))];
  const placeCount = days.reduce((n, d) => n + d.places.length, 0);

  return {
    reply: summarise(days, trip.interests),
    asked: [
      `I have ${trip.days} days`,
      trip.budget ? `₹${trip.budget.toLocaleString("en-IN")}` : null,
      trip.dietary,
      trip.interests.length > 0 ? trip.interests.join(", ") : null,
    ]
      .filter(Boolean)
      .join(" · "),
    cities,
    placeCount,
    chosen: days.map((d) => ({
      day: d.day,
      cityName: d.cityName,
      places: d.places.map((p) => p.name),
    })),
    hiddenNames: days
      .flatMap((d) => d.places)
      .filter((p) => p.kind === "hidden_gem")
      .map((p) => p.name),
    split: trip.budget ? budgetSplit(trip.budget) : [],
    pace: placeCount / Math.max(1, days.length) < 2 ? "Unhurried" : "Full",
  };
}
