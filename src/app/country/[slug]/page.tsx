import Link from "next/link";
import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import Motif from "@/components/Motif";
import { accentFor } from "@/lib/accent";
import SoundToggle from "@/components/SoundToggle";
import {
  getCountryBySlug,
  listCitiesForCountry,
  listRegionsForCountry,
} from "@/modules/destination/queries";
import { getPhoto } from "@/modules/media/wikimedia";

export const dynamic = "force-dynamic";

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) notFound();

  const cities = await listCitiesForCountry(country.id);
  const regions = await listRegionsForCountry(country.id);
  const mapped = regions.filter((r) => r.placeCount > 0);
  const rest = regions.filter((r) => r.placeCount === 0);
  const [hero, ...cityPhotos] = await Promise.all([
    getPhoto("countries", country.id, country.name, country.wikidataId),
    ...cities.map((c) => getPhoto("cities", c.id, `${c.name}, ${country.name}`, c.wikidataId)),
  ]);

  const totalPlaces = cities.reduce((n, c) => n + c.placeCount, 0);
  const accent = accentFor(country.motif);

  return (
    <main className="relative min-h-dvh bg-paper">
      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-6">
        <SoundToggle motif={country.motif} />
      </div>

      <Hero
        title={country.name}
        summary={country.summary}
        photo={hero}
        seed={country.slug}
        kicker={
          <div className="animate-float-in">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-neutral-600 transition hover:text-forest"
            >
              <span aria-hidden>←</span> All countries
            </Link>
            <div className="mt-6 flex items-center gap-3 text-sm text-neutral-600">
              <span className="text-4xl leading-none">{country.emoji}</span>
              <span className={`h-px w-8 ${accent.rule}`} />
              <span>
                {cities.length} {cities.length === 1 ? "city" : "cities"} · {totalPlaces} places
              </span>
            </div>
          </div>
        }
      />

      {country.motif && (
        <div className="relative mx-auto -mt-6 max-w-6xl px-6 sm:px-10">
          <Motif motif={country.motif} className="motif-float mx-auto h-24 w-full max-w-2xl opacity-95" />
        </div>
      )}

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-4 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className={`flex items-center gap-4 text-xs uppercase tracking-[0.35em] ${accent.text}`}>
            Where to go
            <span className={`h-px w-16 ${accent.rule}`} />
          </h2>
          <Link
            href={`/country/${country.slug}/plan`}
            className="rounded-full px-6 py-2.5 text-sm font-medium text-cream transition hover:opacity-90"
            style={{ backgroundColor: accent.hex }}
          >
            Plan a trip
          </Link>
        </div>

        {regions.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xs uppercase tracking-[0.18em] text-neutral-600">
              Browse by {regions[0].kind}
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {mapped.map((region) => (
                <Link
                  key={region.id}
                  href={`/country/${country.slug}/region/${region.slug}`}
                  className="rounded-full border border-clay/40 bg-cream px-4 py-1.5 text-sm text-forest shadow-sm transition hover:border-clay"
                >
                  {region.name}
                  <span className="ml-2 text-xs text-clay">{region.placeCount}</span>
                </Link>
              ))}
              {rest.map((region) => (
                <Link
                  key={region.id}
                  href={`/country/${country.slug}/region/${region.slug}`}
                  className="rounded-full border border-ink/10 px-4 py-1.5 text-sm text-neutral-500 transition hover:border-ink/25"
                >
                  {region.name}
                </Link>
              ))}
            </div>
            {rest.length > 0 && (
              <p className="mt-3 text-xs text-neutral-500">
                {mapped.length} of {regions.length} mapped so far — faded ones have nothing
                verified yet.
              </p>
            )}
          </div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-6">
          {cities.map((city, i) => {
            const photo = cityPhotos[i];
            // First card runs wide; the rest pair up, so the grid never reads as a uniform table.
            const wide = i === 0;
            return (
              <Reveal
                key={city.id}
                delay={i * 90}
                className={wide ? "md:col-span-6" : "md:col-span-3"}
              >
                <Link
                  href={`/country/${country.slug}/${city.slug}`}
                  className="group relative block h-full overflow-hidden rounded-2xl border border-ink/[0.08] bg-cream transition duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20 hover:border-current"
                >
                  <div className={`relative overflow-hidden ${wide ? "h-72" : "h-56"}`}>
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
                    <span className="absolute right-4 top-4 rounded-full bg-paper/70 px-3 py-1 text-xs font-medium text-clay backdrop-blur">
                      {city.placeCount} places
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="font-display text-2xl font-medium text-forest transition group-hover:opacity-90">
                      {city.name}
                    </h3>
                    {city.summary && (
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
                        {city.summary}
                      </p>
                    )}
                    <span className={`mt-4 inline-flex items-center gap-2 text-sm opacity-0 ${accent.text} transition duration-300 group-hover:opacity-100`}>
                      Explore {city.name}
                      <span className="transition group-hover:translate-x-1" aria-hidden>
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </main>
  );
}
