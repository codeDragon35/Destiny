import type { PlannedDay } from "./planner";

/**
 * Phrasing for the planning conversation. There is no LLM — replies are composed
 * from the deterministic plan, so every number shown is one the planner actually
 * produced. Keeps the screen honest while reading as a conversation.
 */
export type GuideReply = {
  text: string;
  chips: string[];
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

export function summarise(days: PlannedDay[], interests: string[]): GuideReply {
  const cities = [...new Set(days.map((d) => d.cityName))];
  const placeCount = days.reduce((n, d) => n + d.places.length, 0);
  const natureDays = days.filter((d) =>
    d.places.some((p) => p.kind === "nature" || p.kind === "hidden_gem"),
  ).length;

  const route = cities.join(" → ");
  const shape = interests.includes("nature")
    ? "walks in the morning and slower afternoons"
    : "the big sights early, before the crowds";

  return {
    text:
      `Then let's keep you off the rush. I've built a ${days.length}-day loop through ${route}, ` +
      `with ${shape}. That's ${placeCount} places across ${cities.length} ` +
      `${cities.length === 1 ? "base" : "bases"}, ${natureDays} of them with time outdoors.`,
    chips: ["Make it slower", "Add a hot spring night", "Cut the budget", "Swap a city"],
  };
}
