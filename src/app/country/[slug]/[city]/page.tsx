import Link from "next/link";
import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import {
  getCityBySlug,
  getCountryBySlug,
  listPlacesForCity,
} from "@/modules/destination/queries";
import { getPhoto } from "@/modules/media/wikimedia";
import { listCollectiblesForCity } from "@/modules/souvenir/queries";
import { eventsForCity, formatRange } from "@/modules/destination/seasons";
import CollectibleBadge from "@/components/CollectibleBadge";
import Sparkles from "@/components/Sparkles";
import SoundToggle from "@/components/SoundToggle";
import { accentFor } from "@/lib/accent";
import { eventTone } from "@/lib/event-tone";

export const dynamic = "force-dynamic";

const KIND = {
  attraction: { label: "Attraction", hoverText: "group-hover:text-clay", chip: "bg-paper/85 text-clay ring-1 ring-jade/30", ring: "hover:border-clay/40" },
  nature: { label: "Nature", hoverText: "group-hover:text-neutral-700", chip: "bg-paper/85 text-neutral-700 ring-1 ring-mist/30", ring: "hover:border-mist/40" },
  culture: { label: "Culture", hoverText: "group-hover:text-clay", chip: "bg-paper/85 text-clay ring-1 ring-gold/30", ring: "hover:border-clay/40" },
  food: { label: "Food", hoverText: "group-hover:text-accent-600", chip: "bg-paper/85 text-accent-600 ring-1 ring-coral/30", ring: "hover:border-accent-300/40" },
  hidden_gem: { label: "Hidden gem", hoverText: "group-hover:text-clay", chip: "bg-paper/85 text-clay ring-1 ring-gold/40", ring: "hover:border-clay/50" },
} as const;

function kindOf(k: string) {
  return KIND[k as keyof typeof KIND] ?? KIND.attraction;
}

function formatVisit(minutes: number | null) {
  if (!minutes) return null;
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string; city: string }>;
}) {
  const { slug, city: citySlug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) notFound();

  const city = await getCityBySlug(country.id, citySlug);
  if (!city) notFound();

  const places = await listPlacesForCity(city.id);
  const collectibles = await listCollectiblesForCity(city.id);
  const events = await eventsForCity(city.id);
  const accent = accentFor(country.motif);
  const [cityPhoto, ...placePhotos] = await Promise.all([
    getPhoto("cities", city.id, `${city.name}, ${country.name}`, city.wikidataId),
    ...places.map((p) => getPhoto("places", p.id, `${p.name}, ${city.name}`, p.wikidataId)),
  ]);

  // A city's own Wikidata image is often a generic street or skyline shot; the
  // landscape and landmark photos sell the destination far better.
  const HERO_PRIORITY = ["nature", "attraction", "culture"];
  const heroIndex = HERO_PRIORITY.flatMap((kind) =>
    places.flatMap((p, i) => (p.kind === kind && placePhotos[i] ? [i] : [])),
  )[0];
  // Cards always keep their own photo: showing a city street shot on a mountain
  // is worse than the hero repeating one image below it.
  const hero = heroIndex === undefined ? cityPhoto : placePhotos[heroIndex];

  const totalHours = places.reduce((n, p) => n + (p.visitMinutes ?? 0), 0) / 60;

  return (
    <main className="relative min-h-dvh bg-paper">
      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-6">
        <SoundToggle motif={country.motif} />
      </div>

      <Hero
        title={city.name}
        summary={city.summary}
        photo={hero}
        seed={city.slug}
        kicker={
          <div className="animate-float-in">
            <Link
              href={`/country/${country.slug}`}
              className="inline-flex items-center gap-2 text-sm text-neutral-600 transition hover:text-forest"
            >
              <span aria-hidden>←</span> {country.name}
            </Link>
            <div className="mt-6 flex items-center gap-3 text-sm text-neutral-600">
              <span>{places.length} places</span>
              <span className="h-px w-8 bg-clay/50" />
              <span>≈{Math.round(totalHours)}h to see it all</span>
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className={`flex items-center gap-4 text-xs uppercase tracking-[0.35em] ${accent.text}`}>
            What to see
            <span className={`h-px w-16 ${accent.rule}`} />
          </h2>
          <Link
            href={`/country/${country.slug}/plan?city=${city.slug}`}
            className="rounded-full px-6 py-2.5 font-display text-sm text-cream shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: accent.hex }}
          >
            Plan a trip here
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {places.map((place, i) => {
            const k = kindOf(place.kind);
            const photo = placePhotos[i];
            const visit = formatVisit(place.visitMinutes);
            return (
              <Reveal key={place.id} delay={i * 80}>
                <article
                  className={`group h-full overflow-hidden rounded-2xl border border-ink/[0.08] bg-cream transition duration-500 hover:-translate-y-1 ${k.ring}`}
                >
                  <div className="relative h-52 overflow-hidden">
                    {photo ? (
                      <img
                        src={photo.url}
                        alt=""
                        className="washed h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-cream via-paper to-cream" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-cream to-transparent" />
                    <span
                      className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium backdrop-blur ${k.chip}`}
                    >
                      {k.label}
                    </span>
                    {visit && (
                      <span className="absolute right-4 top-4 rounded-full bg-paper/70 px-3 py-1 text-xs text-neutral-700 backdrop-blur">
                        {visit}
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className={`font-display text-xl font-medium text-forest transition ${k.hoverText}`}>
                      {place.name}
                    </h3>
                    {place.summary && (
                      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{place.summary}</p>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {events.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-4 sm:px-10">
          <h2 className="text-xs uppercase tracking-[0.35em] text-accent-600">While you&apos;re there</h2>
          <p className="mt-3 max-w-xl text-sm text-neutral-600">
            Festivals and seasons worth timing a visit around.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {events.map((ev, i) => (
              <Reveal key={ev.id} delay={i * 70} className="h-full">
                <article
                  className={`relative h-full overflow-hidden rounded-xl border p-5 ${eventTone(ev.name).border} ${eventTone(ev.name).bg}`}
                >
                  <Sparkles />
                  <div className="relative">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className={`text-xs uppercase tracking-[0.2em] ${eventTone(ev.name).text}`}>
                        {formatRange(ev.startMonth, ev.endMonth)}
                      </span>
                      <span className="text-xs text-neutral-600/70">{ev.placeName}</span>
                    </div>
                    <h3 className="mt-2 text-forest">{ev.name}</h3>
                    {ev.description && (
                      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                        {ev.description}
                      </p>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {collectibles.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-24 sm:px-10">
          <h2 className="text-xs uppercase tracking-[0.35em] text-clay">Don&apos;t miss</h2>
          <p className="mt-3 max-w-xl text-sm text-neutral-600">
            Stamps, passports and collectibles you can only pick up here.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collectibles.map((item, i) => (
              <Reveal key={item.id} delay={i * 70} className="h-full">
                <CollectibleBadge item={item} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
