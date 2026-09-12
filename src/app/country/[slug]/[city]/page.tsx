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
  const [hero, ...placePhotos] = await Promise.all([
    getPhoto("cities", city.id, `${city.name}, ${country.name}`, city.wikidataId),
    ...places.map((p) => getPhoto("places", p.id, `${p.name}, ${city.name}`, p.wikidataId)),
  ]);

  const totalHours = places.reduce((n, p) => n + (p.visitMinutes ?? 0), 0) / 60;

  return (
    <main className="min-h-dvh bg-space">
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
    </main>
  );
}
