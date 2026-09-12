import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import { kindOf } from "@/components/CollectibleBadge";
import { getTripBySlug } from "@/modules/trip/queries";
import { collectiblesByPlaceIds, type Collectible } from "@/modules/souvenir/queries";
import { getProgress } from "@/modules/passport/queries";
import { listMemories } from "@/modules/passport/memories";
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

  const allCollectibles = [...chapters.values()].flatMap((c) => c.collectibles);
  const visited = progress.places.size;
  const collected = progress.collectibles.size;
  const year = new Date().getFullYear();

  return (
    <main className="min-h-dvh bg-space">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <div className="flex items-center justify-between gap-4">
          <Link href={`/trip/${slug}`} className="text-sm text-soft-gray transition hover:text-jade">
            ← Itinerary
          </Link>
          <SoundToggle motif={country?.motif} />
        </div>

        <header className="relative mt-10 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.10] via-midnight to-space p-8 shadow-2xl shadow-gold/5 sm:p-12">
          <Sparkles />
          {country?.motif && (
            <Motif
              motif={country.motif}
              className="pointer-events-none absolute inset-x-0 -top-2 h-32 w-full opacity-45"
            />
          )}
          <div className="relative">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-gold">
              <span aria-hidden>✦</span>
              Travel passport
            </div>
            <h1 className="passport-title mt-5 font-display text-4xl font-semibold leading-tight sm:text-6xl">
              My {trip.countryName} Journey
            </h1>
            <p className="mt-2 text-2xl font-light text-gold/70">{year}</p>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <span className="text-soft-gray">
                <span className="font-display text-2xl font-medium text-jade">{visited}</span>
                <span className="text-soft-gray/60">/{placeIds.length}</span> visited
              </span>
              <span className="text-soft-gray">
                <span className="font-display text-2xl font-medium text-gold">{collected}</span>
                <span className="text-soft-gray/60">/{allCollectibles.length}</span> collected
              </span>
              <span className="text-soft-gray">
                <span className="font-display text-2xl font-medium text-ivory">{chapters.size}</span> cities
              </span>
            </div>
          </div>
        </header>

        {stops.length > 0 && country && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-midnight to-dusk/40/60 p-4 sm:p-6">
            <RouteMap countryCode={country.code} stops={stops} />
          </section>
        )}

        <div className="mt-14 space-y-12">
          {[...chapters.values()].map((chapter, ci) => (
            <Reveal key={chapter.cityName} delay={ci * 80}>
              <section>
                <div className="flex items-baseline gap-3">
                  <h2 className="font-display text-2xl font-medium text-ivory">{chapter.cityName}</h2>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {chapter.places.map((place) => {
                    const done = progress.places.has(place.id);
                    const photo = photos.get(place.id);
                    return (
                      <div
                        key={place.id}
                        className={`relative overflow-hidden rounded-xl border ${
                          done ? "border-jade/40" : "border-white/5"
                        }`}
                      >
                        <div className="relative h-36">
                          {photo ? (
                            <img
                              src={photo.url}
                              alt=""
                              className={`h-full w-full object-cover ${done ? "" : "grayscale opacity-40"}`}
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-midnight to-space" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/30 to-transparent" />

                          {done && (
                            <span className="stamp-in absolute right-3 top-3 rounded-md border-2 border-jade bg-space/85 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-jade shadow-lg backdrop-blur-sm">
                              Visited
                            </span>
                          )}
                        </div>
                        <p className={`px-4 py-3 text-sm ${done ? "text-ivory" : "text-soft-gray"}`}>
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
                          className={`relative flex items-start gap-3 overflow-hidden rounded-xl border px-5 py-4 ${
                            done
                              ? "border-gold/50 bg-gold/[0.08]"
                              : "border-dashed border-white/10 opacity-50"
                          }`}
                        >
                          {done && <Sparkles />}
                          <span
                            className={`relative text-lg leading-none ${done ? "text-gold" : "text-soft-gray/40"}`}
                            aria-hidden
                          >
                            {kindOf(item.kind).icon}
                          </span>
                          <span className="relative">
                            <span className={done ? "text-ivory" : "text-soft-gray"}>
                              {item.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-soft-gray/70">
                              {done ? "Collected" : "Not collected"}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </Reveal>
          ))}
        </div>

        {memories.length > 0 && (
          <section className="mt-16">
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-2xl font-medium text-ivory">Your memories</h2>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {memories.map((m, i) => (
                <Reveal key={m.id} delay={i * 70} className="h-full">
                  <figure className="h-full overflow-hidden rounded-xl border border-gold/20 bg-midnight">
                    {m.imagePath && (
                      <img
                        src={`/api/uploads/${m.imagePath}`}
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                    )}
                    {m.note && (
                      <figcaption className="px-4 py-3 text-sm leading-relaxed text-soft-gray">
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
            className="text-sm text-jade transition hover:text-jade/80"
          >
            ← Update what you collected
          </Link>
        </div>
      </div>
    </main>
  );
}
