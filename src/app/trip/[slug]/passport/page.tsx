import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import { kindOf } from "@/components/CollectibleBadge";
import { getTripBySlug } from "@/modules/trip/queries";
import { collectiblesByPlaceIds, type Collectible } from "@/modules/souvenir/queries";
import { getProgress } from "@/modules/passport/queries";
import { listMemories } from "@/modules/passport/memories";
import { regionsForPlaces } from "@/modules/trip/queries";
import PassportActions from "@/components/PassportActions";
import { pageStyleFor } from "@/lib/page-style";
import { auth } from "@/auth";
import { getPhoto } from "@/modules/media/wikimedia";
import { listCitiesForCountry, getCountryBySlug } from "@/modules/destination/queries";
import RouteMap from "@/components/RouteMap";
import Sparkles from "@/components/Sparkles";
import Motif from "@/components/Motif";
import SoundToggle from "@/components/SoundToggle";

export const dynamic = "force-dynamic";

type CityChapter = {
  cityName: string;
  places: { id: string; name: string; kind: string; summary: string | null }[];
  collectibles: Collectible[];
};

type PlacePhoto = { url: string } | null;

export default async function PassportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  const days = trip.plan.days ?? [];
  const placeIds = days.flatMap((d) => d.places.map((p) => p.id));
  const session = await auth();
  const [collectibles, progress, memories] = await Promise.all([
    collectiblesByPlaceIds(placeIds),
    getProgress(trip.id),
    listMemories(trip.id),
  ]);

  // Collapse the day-by-day plan into one chapter per city.
  const chapters = new Map<string, CityChapter>();
  for (const day of days) {
    const chapter = chapters.get(day.cityName) ?? {
      cityName: day.cityName,
      places: [],
      collectibles: [],
    };
    for (const place of day.places) {
      if (chapter.places.some((p) => p.id === place.id)) continue;
      chapter.places.push({
        id: place.id,
        name: place.name,
        kind: place.kind,
        summary: place.summary,
      });
      chapter.collectibles.push(...(collectibles.get(place.id) ?? []));
    }
    chapters.set(day.cityName, chapter);
  }

  // Photos for every place in the book, plus city coordinates for the route map.
  const country = await getCountryBySlug(trip.countrySlug);
  const cityRows = country ? await listCitiesForCountry(country.id) : [];
  const cityByName = new Map(cityRows.map((c) => [c.name, c]));

  const allPlaces = [...chapters.values()].flatMap((c) => c.places);
  const photoList = await Promise.all(
    allPlaces.map((p) =>
      getPhoto("places", p.id, p.name, null).catch(() => null),
    ),
  );
  const photos = new Map<string, PlacePhoto>(
    allPlaces.map((p, i) => [p.id, photoList[i]]),
  );

  const stops = [...chapters.values()].flatMap((chapter) => {
    const city = cityByName.get(chapter.cityName);
    if (!city) return [];
    return [{
      name: chapter.cityName,
      lat: city.lat,
      lng: city.lng,
      visited: chapter.places.some((p) => progress.places.has(p.id)),
    }];
  });

  const regionByPlace = await regionsForPlaces(placeIds);
  // A trip scoped to one or two states should say so rather than naming the country.
  const regionNames = [...new Set([...regionByPlace.values()])];
  const scopeLabel =
    regionNames.length > 0 && regionNames.length <= 2
      ? regionNames.join(" & ")
      : trip.countryName;

  // Chapters group under their state, so a two-state trip reads as two sections.
  const sections = new Map<string, CityChapter[]>();
  for (const chapter of chapters.values()) {
    const placeId = chapter.places[0]?.id;
    const region = (placeId && regionByPlace.get(placeId)) || trip.countryName;
    const list = sections.get(region) ?? [];
    list.push(chapter);
    sections.set(region, list);
  }

  const allCollectibles = [...chapters.values()].flatMap((c) => c.collectibles);
  const visited = progress.places.size;
  const collected = progress.collectibles.size;
  const year = new Date().getFullYear();

  return (
    <main className="min-h-dvh bg-paper">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <div className="flex items-center justify-between gap-4">
          <Link href={`/trip/${slug}`} className="text-sm text-neutral-600 transition hover:text-clay">
            ← Itinerary
          </Link>
          <SoundToggle motif={country?.motif} />
        </div>

        <header className="passport-page relative mt-10 overflow-hidden rounded-md border border-clay/25 bg-forest p-8 text-cream shadow-lg sm:p-10">
          <Sparkles />
          {country?.motif && (
            <Motif
              motif={country.motif}
              className="pointer-events-none absolute inset-x-0 -top-2 h-28 w-full opacity-40"
            />
          )}
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cream/60">
                Travel passport — the book
              </p>
              <p className="text-[11px] text-cream/50">
                {session?.user?.email?.split("@")[0] ?? "traveller"} ·{" "}
                {trip.countrySlug.slice(0, 2).toUpperCase()}-{trip.slug.slice(0, 4).toUpperCase()}
              </p>
            </div>

            <h1 className="mt-4 font-display text-4xl sm:text-5xl">My {scopeLabel} Journey</h1>
            <p className="mt-1 text-2xl font-light text-clay">{year}</p>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <span className="text-cream/70">
                <span className="font-display text-2xl text-cream">{sections.size}</span> pages
              </span>
              <span className="text-cream/70">
                <span className="font-display text-2xl text-cream">{visited}</span>
                <span className="text-cream/50">/{placeIds.length}</span> visited
              </span>
              <span className="text-cream/70">
                <span className="font-display text-2xl text-clay">{collected}</span>
                <span className="text-cream/50">/{allCollectibles.length}</span> stamps
              </span>
              {memories.length > 0 && (
                <span className="text-cream/70">
                  <span className="font-display text-2xl text-cream">{memories.length}</span> kept
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="mt-6">
          <PassportActions title={`My ${scopeLabel} Journey`} />
        </div>

        {stops.length > 0 && country && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-ink/[0.08] bg-cream/60 p-4 sm:p-6">
            <RouteMap countryCode={country.code} stops={stops} />
          </section>
        )}

        <div className="mt-14 space-y-14">
          {[...sections.entries()].map(([regionName, group], si) => {
            const style = pageStyleFor(
              group.flatMap((c) => c.places.map((p) => p.kind)),
              regionName,
            );
            return (
            <section
              key={regionName}
              className={`passport-chapter rounded-md p-6 sm:p-8 ${style.surface}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className={`font-display text-3xl ${style.heading}`}>{regionName}</h2>
                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  {style.label} · {String(si + 1).padStart(2, "0")} · {group.length}{" "}
                  {group.length === 1 ? "stop" : "stops"}
                </p>
              </div>
              <span className={`mt-2 block h-px w-full ${style.rule}`} />

              <div className="mt-6 space-y-10">
                {group.map((chapter, ci) => (
                  <Reveal key={chapter.cityName} delay={ci * 80}>
                    <div className="passport-page">
                      <h3 className="font-display text-2xl text-forest">{chapter.cityName}</h3>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {chapter.places.map((place) => {
                          const done = progress.places.has(place.id);
                          const photo = photos.get(place.id);
                          return (
                            <div
                              key={place.id}
                              className={`relative overflow-hidden rounded-md border bg-cream shadow-sm ${
                                done ? "border-clay/40" : "border-ink/[0.08]"
                              }`}
                            >
                              <div className="relative h-36 bg-surface">
                                {photo ? (
                                  <img
                                    src={photo.url}
                                    alt=""
                                    className={`h-full w-full object-cover ${done ? "washed" : "opacity-40 grayscale"}`}
                                  />
                                ) : (
                                  <div className="h-full w-full bg-surface" />
                                )}
                                {done && (
                                  <span className="stamp-in absolute right-3 top-3 rounded-md border-2 border-clay bg-cream/90 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-clay shadow-sm">
                                    Visited
                                  </span>
                                )}
                              </div>
                              <p className={`px-4 py-3 text-sm ${done ? "text-forest" : "text-neutral-500"}`}>
                                {place.name}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {chapter.collectibles.length > 0 && (
                        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                          {chapter.collectibles.map((item) => {
                            const done = progress.collectibles.has(item.id);
                            return (
                              <li
                                key={item.id}
                                className={`relative flex items-start gap-3 overflow-hidden rounded-md border px-5 py-4 ${
                                  done
                                    ? "border-clay/50 bg-accent-100"
                                    : "border-dashed border-ink/15 opacity-55"
                                }`}
                              >
                                {done && <Sparkles />}
                                <span
                                  className={`relative text-lg leading-none ${done ? "text-clay" : "text-neutral-400"}`}
                                  aria-hidden
                                >
                                  {kindOf(item.kind).icon}
                                </span>
                                <span className="relative">
                                  <span className={done ? "text-forest" : "text-neutral-600"}>
                                    {item.name}
                                  </span>
                                  <span className="mt-0.5 block text-xs text-neutral-500">
                                    {done ? "Collected" : "Not collected"}
                                  </span>
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>
            );
          })}
        </div>
        {memories.length > 0 && (
          <section className="mt-16">
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-2xl font-medium text-forest">Your memories</h2>
              <span className="h-px flex-1 bg-ink/5" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {memories.map((m, i) => (
                <Reveal key={m.id} delay={i * 70} className="h-full">
                  <figure className="h-full overflow-hidden rounded-xl border border-clay/20 bg-cream">
                    {m.imagePath && (
                      <img
                        src={`/api/uploads/${m.imagePath}`}
                        alt=""
                        className="washed h-40 w-full object-cover"
                      />
                    )}
                    {m.note && (
                      <figcaption className="px-4 py-3 text-sm leading-relaxed text-neutral-600">
                        {m.note}
                      </figcaption>
                    )}
                  </figure>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        <div className="mt-16 text-center">
          <Link
            href={`/trip/${slug}/collect`}
            className="text-sm text-clay transition hover:text-clay/80"
          >
            ← Update what you collected
          </Link>
        </div>
      </div>
    </main>
  );
}
