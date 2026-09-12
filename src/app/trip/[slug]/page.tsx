import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import { getTripBySlug } from "@/modules/trip/queries";
import { collectiblesByPlaceIds } from "@/modules/souvenir/queries";
import {
  eventsForPlaces,
  seasonalityForPlaces,
  formatRange,
  monthInRange,
  monthName,
} from "@/modules/destination/seasons";
import { kindOf } from "@/components/CollectibleBadge";
import { getPhoto } from "@/modules/media/wikimedia";
import { getCountryBySlug } from "@/modules/destination/queries";
import Hero from "@/components/Hero";
import Motif from "@/components/Motif";
import SoundToggle from "@/components/SoundToggle";

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
  const collectibles = await collectiblesByPlaceIds(
    days.flatMap((d) => d.places.map((p) => p.id)),
  );
  const collectibleCount = [...collectibles.values()].reduce((n, list) => n + list.length, 0);

  const placeIds = days.flatMap((d) => d.places.map((p) => p.id));
  const [seasons, events] = await Promise.all([
    seasonalityForPlaces(placeIds),
    eventsForPlaces(placeIds),
  ]);

  // Month of travel drives both the "bad timing" warnings and which events are catchable.
  const travelMonth = trip.startDate ? new Date(trip.startDate).getUTCMonth() + 1 : null;

  const allPlaces = days.flatMap((d) => d.places);
  const photoList = await Promise.all(
    allPlaces.map((pl) => getPhoto("places", pl.id, pl.name, pl.wikidataId).catch(() => null)),
  );
  const photos = new Map(allPlaces.map((pl, i) => [pl.id, photoList[i]]));
  const country = await getCountryBySlug(trip.countrySlug);
  // Lead with the most striking place on the trip, as the city pages do.
  const heroPhoto =
    photoList.find((photo, i) => photo && allPlaces[i].kind === "nature") ??
    photoList.find(Boolean) ??
    null;
  const totalPlaces = days.reduce((n, d) => n + d.places.length, 0);
  const cities = [...new Set(days.map((d) => d.cityName))];

  return (
    <main className="relative min-h-dvh bg-space">
      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-6">
        <SoundToggle motif={country?.motif} />
      </div>

      <Hero
        title={`${days.length} days in ${trip.countryName}`}
        photo={heroPhoto}
        seed={trip.slug}
        height="h-[42vh]"
        kicker={
          <div className="animate-float-in">
            <Link
              href={`/country/${trip.countrySlug}`}
              className="inline-flex items-center gap-2 text-sm text-mist/70 transition hover:text-jade"
            >
              <span aria-hidden>←</span> {trip.countryName}
            </Link>
            <p className="mt-5 text-xs uppercase tracking-[0.35em] text-jade">Your itinerary</p>
          </div>
        }
      />

      {country?.motif && (
        <div className="mx-auto max-w-3xl px-6 pt-8 sm:px-10">
          <Motif motif={country.motif} className="motif-float mx-auto h-16 w-full opacity-70" />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-soft-gray">
          <span>{cities.join(" → ")}</span>
          <span className="text-soft-gray/40">·</span>
          <span>{totalPlaces} places</span>
          {collectibleCount > 0 && (
            <>
              <span className="text-soft-gray/40">·</span>
              <span className="text-gold">{collectibleCount} to collect</span>
            </>
          )}
          {trip.startDate && (
            <>
              <span className="text-soft-gray/40">·</span>
              <span className="text-mist">
                {new Date(trip.startDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            </>
          )}
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
                      <li key={place.id} className="flex gap-4 px-6 py-4">
                        <div className="hidden h-20 w-28 shrink-0 overflow-hidden rounded-lg sm:block">
                          {photos.get(place.id) ? (
                            <img
                              src={photos.get(place.id)!.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-space to-midnight" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
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
                        {travelMonth &&
                          (() => {
                            const season = seasons.get(place.id);
                            const best = season?.bestMonths;
                            if (!best || best.length === 0 || best.includes(travelMonth)) return null;
                            return (
                              <p className="mt-2 text-sm text-coral">
                                <span aria-hidden>△</span> Better in{" "}
                                {best.map(monthName).join(", ")}
                                {season?.seasonNote && (
                                  <span className="block text-xs text-soft-gray">
                                    {season.seasonNote}
                                  </span>
                                )}
                              </p>
                            );
                          })()}

                        {(events.get(place.id) ?? [])
                          .filter(
                            (ev) =>
                              travelMonth === null ||
                              monthInRange(travelMonth, ev.startMonth, ev.endMonth),
                          )
                          .map((ev) => (
                            <p key={ev.id} className="mt-2 text-sm text-jade">
                              <span aria-hidden>✦</span> {ev.name}{" "}
                              <span className="text-xs text-soft-gray">
                                {formatRange(ev.startMonth, ev.endMonth)}
                              </span>
                            </p>
                          ))}

                        {(collectibles.get(place.id) ?? []).map((item) => (
                          <p
                            key={item.id}
                            className="mt-2 flex flex-wrap items-baseline gap-x-2 text-sm text-gold"
                          >
                            <span aria-hidden>{kindOf(item.kind).icon}</span>
                            <span>{item.name}</span>
                            {item.whereToGet && (
                              <span className="text-xs text-soft-gray">{item.whereToGet}</span>
                            )}
                          </p>
                        ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              </Reveal>
            );
          })}
        </ol>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link
            href={`/trip/${trip.slug}/collect`}
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-space transition hover:bg-gold/90"
          >
            Create my passport
          </Link>
          <Link
            href={`/country/${trip.countrySlug}/plan`}
            className="text-sm text-jade transition hover:text-jade/80"
          >
            Plan a different trip →
          </Link>
        </div>
      </div>
    </main>
  );
}
