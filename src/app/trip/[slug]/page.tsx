import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import { getTripBySlug } from "@/modules/trip/queries";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  attraction: "Attraction",
  nature: "Nature",
  culture: "Culture",
  food: "Food",
  hidden_gem: "Hidden gem",
};

const KIND_COLOR: Record<string, string> = {
  attraction: "text-jade",
  nature: "text-mist",
  culture: "text-gold",
  food: "text-coral",
  hidden_gem: "text-gold",
};

function hours(minutes: number) {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  const days = trip.plan.days ?? [];
  const totalPlaces = days.reduce((n, d) => n + d.places.length, 0);
  const cities = [...new Set(days.map((d) => d.cityName))];

  return (
    <main className="min-h-dvh bg-space">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <Link
          href={`/country/${trip.countrySlug}`}
          className="text-sm text-soft-gray transition hover:text-jade"
        >
          ← {trip.countryName}
        </Link>

        <p className="mt-10 text-xs uppercase tracking-[0.35em] text-jade">Your itinerary</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-ivory sm:text-5xl">
          {days.length} days in {trip.countryName}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-soft-gray">
          <span>{cities.join(" → ")}</span>
          <span className="text-soft-gray/40">·</span>
          <span>{totalPlaces} places</span>
          {trip.dietary && (
            <>
              <span className="text-soft-gray/40">·</span>
              <span className="text-coral">{trip.dietary}</span>
            </>
          )}
          {trip.budget && (
            <>
              <span className="text-soft-gray/40">·</span>
              <span className="text-gold">Budget {trip.budget.toLocaleString()}</span>
            </>
          )}
        </div>

        {trip.plan.unfilledDays > 0 && (
          <p className="mt-6 rounded-xl border border-gold/20 bg-gold/5 px-5 py-4 text-sm text-gold/90">
            We planned {days.length} of your {trip.days} days — we don&apos;t have enough places
            in {trip.countryName} yet to fill the rest.
          </p>
        )}

        <ol className="mt-14 space-y-5">
          {days.map((day, i) => {
            const minutes = day.places.reduce((n, p) => n + (p.visitMinutes ?? 120), 0);
            return (
              <Reveal key={day.day} delay={i * 60}>
                <li className="overflow-hidden rounded-2xl border border-white/5 bg-midnight">
                  <div className="flex items-baseline justify-between gap-4 border-b border-white/5 px-6 py-4">
                    <div className="flex items-baseline gap-4">
                      <span className="text-xs uppercase tracking-[0.25em] text-jade">
                        Day {day.day}
                      </span>
                      <span className="text-lg text-ivory">{day.cityName}</span>
                    </div>
                    <span className="text-sm text-soft-gray">{hours(minutes)}</span>
                  </div>

                  <ul className="divide-y divide-white/5">
                    {day.places.map((place) => (
                      <li key={place.id} className="px-6 py-4">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="text-ivory">{place.name}</span>
                          <span className={`text-xs ${KIND_COLOR[place.kind] ?? "text-soft-gray"}`}>
                            {KIND_LABEL[place.kind] ?? place.kind}
                          </span>
                          {place.visitMinutes && (
                            <span className="text-xs text-soft-gray">
                              {hours(place.visitMinutes)}
                            </span>
                          )}
                        </div>
                        {place.summary && (
                          <p className="mt-1 text-sm leading-relaxed text-soft-gray">
                            {place.summary}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              </Reveal>
            );
          })}
        </ol>

        <Link
          href={`/country/${trip.countrySlug}/plan`}
          className="mt-12 inline-block text-sm text-jade transition hover:text-jade/80"
        >
          Plan a different trip →
        </Link>
      </div>
    </main>
  );
}
