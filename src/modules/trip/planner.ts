import type { Place } from "@/modules/destination/queries";

export type Interest = "nature" | "culture" | "food" | "hidden_gem";

export type PlannedPlace = Place & { cityName: string; citySlug: string };
export type PlannedDay = { day: number; cityName: string; places: PlannedPlace[] };

export type TripPlan = {
  days: PlannedDay[];
  /** Days the user asked for that the seeded places cannot fill. */
  unfilledDays: number;
};

/** A comfortable day of sightseeing before travel and meals are counted. */
const MINUTES_PER_DAY = 480;
const DEFAULT_VISIT_MINUTES = 120;

function scoreFor(place: PlannedPlace, interests: Interest[]) {
  let score = 0;
  if (interests.includes(place.kind as Interest)) score += 10;
  // Hidden gems are the app's differentiator, so surface them above generic stops.
  if (place.kind === "hidden_gem") score += 3;
  if (place.kind === "attraction") score += 2;
  return score;
}

/**
 * Packs places into days, keeping each day within one city so travellers are not
 * bounced between cities mid-day. Cities are visited in descending order of how
 * well they match the stated interests.
 */
export function planTrip({
  days,
  interests,
  placesByCity,
}: {
  days: number;
  interests: Interest[];
  placesByCity: { cityName: string; citySlug: string; places: Place[] }[];
}): TripPlan {
  const cities = placesByCity
    .map((c) => {
      const places: PlannedPlace[] = c.places.map((p) => ({
        ...p,
        cityName: c.cityName,
        citySlug: c.citySlug,
      }));
      const ranked = [...places].sort(
        (a, b) => scoreFor(b, interests) - scoreFor(a, interests),
      );
      const relevance = ranked.reduce((n, p) => n + scoreFor(p, interests), 0);
      return { ...c, ranked, relevance };
    })
    .filter((c) => c.ranked.length > 0)
    .sort((a, b) => b.relevance - a.relevance);

  if (cities.length === 0 || days < 1) return { days: [], unfilledDays: Math.max(0, days) };

  // Give every city at least one day, then hand spare days to the best matches.
  const allocation = new Map<string, number>();
  const visitable = cities.slice(0, days);
  for (const c of visitable) allocation.set(c.citySlug, 1);

  let spare = days - visitable.length;
  for (let i = 0; spare > 0; i = (i + 1) % visitable.length) {
    const city = visitable[i];
    const used = allocation.get(city.citySlug) ?? 0;
    // Never allocate more days than a city has places to fill.
    if (used < city.ranked.length) {
      allocation.set(city.citySlug, used + 1);
      spare--;
    } else if (visitable.every((c) => (allocation.get(c.citySlug) ?? 0) >= c.ranked.length)) {
      break;
    }
  }

  const plan: PlannedDay[] = [];
  let dayNumber = 1;

  for (const city of visitable) {
    const cityDays = allocation.get(city.citySlug) ?? 1;
    const queue = [...city.ranked];

    for (let d = 0; d < cityDays && queue.length > 0; d++) {
      const places: PlannedPlace[] = [];
      let minutes = 0;
      // Leave the tail of the queue for this city's remaining days.
      const isLastDayHere = d === cityDays - 1;

      while (queue.length > 0) {
        const next = queue[0];
        const cost = next.visitMinutes ?? DEFAULT_VISIT_MINUTES;
        if (places.length > 0 && minutes + cost > MINUTES_PER_DAY) break;
        places.push(queue.shift() as PlannedPlace);
        minutes += cost;
        if (!isLastDayHere && places.length >= Math.ceil(city.ranked.length / cityDays)) break;
      }

      plan.push({ day: dayNumber++, cityName: city.cityName, places });
    }
  }

  return { days: plan, unfilledDays: Math.max(0, days - plan.length) };
}
