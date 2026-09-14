import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Reveal from "@/components/Reveal";
import {
  getCountryBySlug,
  getRegionBySlug,
  listCitiesForRegion,
} from "@/modules/destination/queries";
import { getPhoto } from "@/modules/media/wikimedia";
import { accentFor } from "@/lib/accent";

export const dynamic = "force-dynamic";

/** One state / province: which cities and places sit inside it. */
export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string; region: string }>;
}) {
  const { slug, region: regionSlug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) notFound();

  const region = await getRegionBySlug(country.id, regionSlug);
  if (!region) notFound();

  const cities = await listCitiesForRegion(region.id);
  const photos = await Promise.all(
    cities.map((c) => getPhoto("cities", c.id, `${c.name}, ${country.name}`, c.wikidataId)),
  );
  const accent = accentFor(country.motif);

  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-10 sm:px-10">
        <Link
          href={`/country/${country.slug}`}
          className="text-sm text-neutral-600 transition hover:text-clay"
        >
          ← {country.name}
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-clay">{region.kind}</p>
        <h1 className="animate-float-in mt-2 font-display text-4xl text-forest sm:text-5xl">
          {region.name}
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          {region.cityCount} {region.cityCount === 1 ? "city" : "cities"} ·{" "}
          {region.placeCount} places mapped
        </p>

        {cities.length === 0 ? (
          <div className="mt-10 rounded-md border border-ink/[0.08] bg-cream p-8 shadow-sm">
            <p className="text-neutral-700">
              Nothing mapped in {region.name} yet — we only add places we can verify.
            </p>
            <Link
              href={`/country/${country.slug}`}
              className="mt-4 inline-block text-sm text-clay hover:underline"
            >
              Browse the rest of {country.name} →
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city, i) => (
              <Reveal key={city.id} delay={i * 80} className="h-full">
                <Link
                  href={`/country/${country.slug}/${city.slug}`}
                  className="group block h-full overflow-hidden rounded-md border border-ink/[0.08] bg-cream shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="h-40 overflow-hidden bg-surface">
                    {photos[i] && (
                      <img
                        src={photos[i]!.url}
                        alt=""
                        className="washed h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="font-display text-xl text-forest">{city.name}</h2>
                      <span className={`text-xs ${accent.text}`}>{city.placeCount} places</span>
                    </div>
                    {city.summary && (
                      <p className="mt-1 text-sm text-neutral-700">{city.summary}</p>
                    )}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
