import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Reveal from "@/components/Reveal";
import { getTripBySlug } from "@/modules/trip/queries";
import { currentDayNumber, scheduleFor, spendSoFar } from "@/modules/trip/today";
import { collectiblesByPlaceIds } from "@/modules/souvenir/queries";
import { listMemories } from "@/modules/passport/memories";
import { getPhoto } from "@/modules/media/wikimedia";
import { getCountryBySlug } from "@/modules/destination/queries";
import { accentFor } from "@/lib/accent";

export const dynamic = "force-dynamic";

/** Screen 1g — the live trip. Today's stops, what you've spent, what you've kept. */
export default async function TodayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { slug } = await params;
  const { day: dayParam } = await searchParams;

  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  const days = trip.plan.days ?? [];
  // Before or after the trip there is no "today", so fall back to day one and
  // let the page say it is a preview rather than pretending the trip is live.
  const liveDay = currentDayNumber(trip.startDate, days.length);
  const requested = dayParam ? Number(dayParam) : null;
  const dayNumber = Math.min(
    days.length,
    Math.max(1, requested && Number.isFinite(requested) ? requested : (liveDay ?? 1)),
  );
  const isLive = liveDay !== null && liveDay === dayNumber;

  const day = days[dayNumber - 1];
  if (!day) notFound();

  const country = await getCountryBySlug(trip.countrySlug);
  const accent = accentFor(country?.motif);
  const schedule = scheduleFor(day);

  const [photos, collectibles, memories] = await Promise.all([
    Promise.all(
      day.places.map((p) => getPhoto("places", p.id, p.name, p.wikidataId).catch(() => null)),
    ),
    collectiblesByPlaceIds(day.places.map((p) => p.id)),
    listMemories(trip.id),
  ]);

  const spent = spendSoFar(trip.budget, dayNumber, days.length);
  const todaysMemories = memories.filter(
    (m) => m.dayNumber === null || m.dayNumber === dayNumber,
  );
  const hero = photos.find(Boolean) ?? null;

  const dayDate = trip.startDate
    ? new Date(
        new Date(`${trip.startDate}T00:00:00Z`).getTime() + (dayNumber - 1) * 86_400_000,
      ).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
    : null;

  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <header className="relative overflow-hidden bg-forest px-6 py-10 text-cream sm:px-10">
          {hero && (
            <img
              src={hero.url}
              alt=""
              className="washed absolute inset-0 h-full w-full object-cover opacity-25"
            />
          )}
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.18em] text-cream/60">
              Day {dayNumber} of {days.length} · {day.cityName}
              {dayDate ? ` · ${dayDate}` : ""}
              {isLive ? "" : " · preview"}
            </p>
            <h1 className="animate-float-in mt-3 font-display text-4xl sm:text-5xl">
              {day.places[0]?.name ?? day.cityName}
            </h1>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/trip/${trip.slug}/today?day=${dayNumber}`}
                className="rounded-full bg-cream px-5 py-2 font-display text-sm text-forest"
              >
                Today
              </Link>
              <Link
                href={`/trip/${trip.slug}`}
                className="rounded-full border border-cream/30 px-5 py-2 font-display text-sm text-cream transition hover:bg-cream/10"
              >
                Full journey
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <ol className="space-y-3">
              {schedule.map(({ place, time }, i) => {
                const items = collectibles.get(place.id) ?? [];
                return (
                  <Reveal key={place.id} delay={i * 70}>
                    <li
                      className={`overflow-hidden rounded-md border bg-cream shadow-sm ${
                        i === 0 ? "border-clay/40" : "border-ink/[0.08]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3 border-b border-ink/[0.06] px-5 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            i === 0 ? "bg-clay text-cream" : "bg-surface text-neutral-700"
                          }`}
                        >
                          {i === 0 && isLive ? `Now · ${time}` : time}
                        </span>
                        {place.visitMinutes && (
                          <span className="text-xs text-neutral-600">
                            {(place.visitMinutes / 60).toFixed(1).replace(/\.0$/, "")} hours
                          </span>
                        )}
                      </div>

                      <div className="flex gap-4 p-5">
                        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-md bg-surface">
                          {photos[i] && (
                            <img
                              src={photos[i]!.url}
                              alt=""
                              className="washed h-full w-full object-cover"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="font-display text-xl text-forest">{place.name}</h2>
                          {place.summary && (
                            <p className="mt-1 text-sm text-neutral-700">{place.summary}</p>
                          )}
                          {items.map((item) => (
                            <p key={item.id} className="mt-2 text-sm text-clay">
                              <span aria-hidden>✦</span> {item.name}
                              {item.whereToGet && (
                                <span className="ml-2 text-xs text-neutral-600">
                                  {item.whereToGet}
                                </span>
                              )}
                            </p>
                          ))}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=15/${place.lat}/${place.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-ink/12 px-4 py-1.5 text-xs text-forest transition hover:border-clay"
                            >
                              Navigate
                            </a>
                            <Link
                              href={`/trip/${trip.slug}/memory?day=${dayNumber}&place=${place.id}`}
                              className="rounded-full px-4 py-1.5 text-xs text-cream transition hover:opacity-90"
                              style={{ backgroundColor: accent.hex }}
                            >
                              Add memory
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  </Reveal>
                );
              })}
            </ol>

            <nav className="mt-6 flex flex-wrap gap-2">
              {days.map((d) => (
                <Link
                  key={d.day}
                  href={`/trip/${trip.slug}/today?day=${d.day}`}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${
                    d.day === dayNumber
                      ? "bg-forest text-cream"
                      : "border border-ink/12 bg-cream text-neutral-700 hover:border-clay"
                  }`}
                >
                  Day {d.day}
                </Link>
              ))}
            </nav>
          </section>

          <aside className="space-y-4">
            {spent !== null && (
              <div className="rounded-md border border-ink/[0.08] bg-cream p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">
                  Spent so far
                </p>
                <p className="mt-2 font-display text-2xl text-forest">
                  ₹{spent.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-neutral-600">
                  of ₹{trip.budget!.toLocaleString("en-IN")}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-clay"
                    style={{ width: `${Math.min(100, (spent / trip.budget!) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-neutral-500">
                  Indicative, not booked prices.
                </p>
              </div>
            )}

            <div className="rounded-md border border-leaf-300 bg-leaf-100 p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-leaf-700">
                Collected today
              </p>
              {todaysMemories.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-700">
                  Nothing kept yet — add a photo or a line as you go.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {todaysMemories.slice(0, 6).map((m) => (
                    <div
                      key={m.id}
                      className="aspect-square overflow-hidden rounded-sm bg-surface"
                    >
                      {m.imagePath ? (
                        <img
                          src={`/api/uploads/${m.imagePath}`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center px-1 text-center text-[9px] text-neutral-600">
                          note
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Link
                href={`/trip/${trip.slug}/memory?day=${dayNumber}`}
                className="mt-4 inline-block rounded-md bg-clay px-5 py-2 font-display text-sm text-cream transition hover:bg-accent-600"
              >
                Add a memory
              </Link>
            </div>

            <div className="rounded-md border border-ink/[0.08] bg-cream p-5 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">
                Journey progress
              </p>
              <p className="mt-2 font-display text-2xl text-forest">
                {dayNumber}
                <span className="text-base text-neutral-500">/{days.length}</span>
              </p>
              <Link
                href={`/trip/${trip.slug}/collect`}
                className="mt-3 inline-block text-xs text-clay hover:underline"
              >
                Stamp today into passport →
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
