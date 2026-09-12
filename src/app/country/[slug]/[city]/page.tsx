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
import Motif from "@/components/Motif";

export const dynamic = "force-dynamic";

const KIND = {
  attraction: { label: "Attraction", hoverText: "group-hover:text-jade", chip: "bg-space/85 text-jade ring-1 ring-jade/30", ring: "hover:border-jade/40" },
  nature: { label: "Nature", hoverText: "group-hover:text-mist", chip: "bg-space/85 text-mist ring-1 ring-mist/30", ring: "hover:border-mist/40" },
  culture: { label: "Culture", hoverText: "group-hover:text-gold", chip: "bg-space/85 text-gold ring-1 ring-gold/30", ring: "hover:border-gold/40" },
  food: { label: "Food", hoverText: "group-hover:text-coral", chip: "bg-space/85 text-coral ring-1 ring-coral/30", ring: "hover:border-coral/40" },
  hidden_gem: { label: "Hidden gem", hoverText: "group-hover:text-gold", chip: "bg-space/85 text-gold ring-1 ring-gold/40", ring: "hover:border-gold/50" },
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
    <main className="relative min-h-dvh bg-space">
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
              className="inline-flex items-center gap-2 text-sm text-mist/70 transition hover:text-jade"
            >
              <span aria-hidden>←</span> {country.name}
            </Link>
            <div className="mt-6 flex items-center gap-3 text-sm text-mist/70">
              <span>{places.length} places</span>
              <span className="h-px w-8 bg-jade/50" />
              <span>≈{Math.round(totalHours)}h to see it all</span>
            </div>
          </div>
        }
      />

      {country.motif && (
        <div className="mx-auto max-w-6xl px-6 pt-10 sm:px-10">
          <Motif motif={country.motif} className="motif-float mx-auto h-20 w-full max-w-2xl opacity-85" />
        </div>
      )}

      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <h2 className="text-xs uppercase tracking-[0.35em] text-jade">What to see</h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {places.map((place, i) => {
            const k = kindOf(place.kind);
            const photo = placePhotos[i];
            const visit = formatVisit(place.visitMinutes);
            return (
              <Reveal key={place.id} delay={i * 80}>
                <article
                  className={`group h-full overflow-hidden rounded-2xl border border-white/5 bg-midnight transition duration-500 hover:-translate-y-1 ${k.ring}`}
                >
                  <div className="relative h-52 overflow-hidden">
                    {photo ? (
                      <img
                        src={photo.url}
                        alt=""
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-midnight via-space to-midnight" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-midnight to-transparent" />
                    <span
                      className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium backdrop-blur ${k.chip}`}
                    >
                      {k.label}
                    </span>
                    {visit && (
                      <span className="absolute right-4 top-4 rounded-full bg-space/70 px-3 py-1 text-xs text-mist/90 backdrop-blur">
                        {visit}
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className={`text-xl font-medium text-ivory transition ${k.hoverText}`}>
                      {place.name}
                    </h3>
                    {place.summary && (
                      <p className="mt-2 text-sm leading-relaxed text-soft-gray">{place.summary}</p>
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
          <h2 className="text-xs uppercase tracking-[0.35em] text-coral">While you&apos;re there</h2>
          <p className="mt-3 max-w-xl text-sm text-soft-gray">
            Festivals and seasons worth timing a visit around.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {events.map((ev, i) => (
              <Reveal key={ev.id} delay={i * 70} className="h-full">
                <article className="relative h-full overflow-hidden rounded-xl border border-coral/25 bg-coral/[0.04] p-5">
                  <Sparkles />
                  <div className="relative">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="text-xs uppercase tracking-[0.2em] text-coral">
                        {formatRange(ev.startMonth, ev.endMonth)}
                      </span>
                      <span className="text-xs text-soft-gray/70">{ev.placeName}</span>
                    </div>
                    <h3 className="mt-2 text-ivory">{ev.name}</h3>
                    {ev.description && (
                      <p className="mt-2 text-sm leading-relaxed text-soft-gray">
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
          <h2 className="text-xs uppercase tracking-[0.35em] text-gold">Don&apos;t miss</h2>
          <p className="mt-3 max-w-xl text-sm text-soft-gray">
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
