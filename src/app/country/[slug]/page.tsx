import Link from "next/link";
import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import { accentFor } from "@/lib/accent";
import {
  getCountryBySlug,
  listCitiesForCountry,
  listRegionsForCountry,
} from "@/modules/destination/queries";
import { getPhoto } from "@/modules/media/wikimedia";
import { regionFeaturesFor } from "@/modules/destination/region-geo";
import RegionPicker from "@/components/RegionPicker";

export const dynamic = "force-dynamic";

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) notFound();

  const cities = await listCitiesForCountry(country.id);
  const regions = await listRegionsForCountry(country.id);
  const mapped = regions.filter((r) => r.placeCount > 0);
  const regionShapes = await regionFeaturesFor(country.name);
  // Only the hero photo is rendered here; cities are shown on their region page.
  const hero = await getPhoto("countries", country.id, country.name, country.wikidataId);

  const totalPlaces = cities.reduce((n, c) => n + c.placeCount, 0);
  const accent = accentFor(country.motif);

  return (
    <main className="relative min-h-dvh bg-paper">
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
          <div className="mt-12">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className={`flex items-center gap-4 text-xs uppercase tracking-[0.35em] ${accent.text}`}>
                Choose a {regions[0].kind}
                <span className={`h-px w-16 ${accent.rule}`} />
              </h3>
              <p className="text-xs text-neutral-500">
                {mapped.length} of {regions.length} mapped so far
              </p>
            </div>

            <RegionPicker
              features={regionShapes}
              regions={regions.map((r) => ({
                slug: r.slug,
                name: r.name,
                kind: r.kind,
                cityCount: r.cityCount,
                placeCount: r.placeCount,
                highlights: r.highlights ?? [],
              }))}
              countrySlug={country.slug}
              accentHex={accent.hex}
              kind={regions[0].kind}
            />
          </div>
        )}

      </section>
    </main>
  );
}
