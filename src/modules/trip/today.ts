import type { PlannedDay } from "./planner";

/**
 * Which day of the trip "today" is, given the start date. Returns null when the
 * trip has no date or has not started — the live view only makes sense in-trip.
 */
export function currentDayNumber(startDate: string | null, days: number): number | null {
  if (!startDate) return null;

  const start = new Date(`${startDate}T00:00:00Z`);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const elapsed = Math.floor((today - start.getTime()) / 86_400_000);
  if (elapsed < 0 || elapsed >= days) return null;
  return elapsed + 1;
}

/** Clock times for a day's stops, spread from an early start. */
export function scheduleFor(day: PlannedDay) {
  let minutes = 9 * 60;
  return day.places.map((place) => {
    const at = minutes;
    minutes += (place.visitMinutes ?? 120) + 45; // travel and a pause between stops
    return {
      place,
      time: `${String(Math.floor(at / 60)).padStart(2, "0")}:${String(at % 60).padStart(2, "0")}`,
    };
  });
}

/** Spend so far, apportioned across elapsed days. Indicative, not booked prices. */
export function spendSoFar(budget: number | null, dayNumber: number, totalDays: number) {
  if (!budget) return null;
  const share = Math.min(1, dayNumber / Math.max(1, totalDays));
  return Math.round(budget * share * 0.82);
}
