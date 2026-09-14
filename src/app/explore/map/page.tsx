import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Reveal from "@/components/Reveal";
import RouteMap from "@/components/RouteMap";
import { listCountries, listCitiesForCountry } from "@/modules/destination/queries";
import { listHiddenPlaces } from "@/modules/destination/queries";
import { getPhoto } from "@/modules/media/wikimedia";

export const dynamic = "force-dynamic";

/** Screen 1d — hidden places, shown against the country outline. */
export default async function HiddenMapPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country: wanted } = await searchParams;
  const countries = await listCountries();
  const country = countries.find((c) => c.slug === wanted) ?? countries[0];
  if (!country) return null;

  const [cities, hidden] = await Promise.all([
    listCitiesForCountry(country.id),
    listHiddenPlaces(12),
  ]);

  const here = hidden.filter((p) => p.countrySlug === country.slug);
  const photos = await Promise.all(
    here.map((p) => getPhoto("places", p.id, p.name, p.wikidataId)),
  );

  const stops = cities.map((c) => ({
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    visited: false,
  }));

  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-10 sm:px-10">
        <p className="text-xs uppercase tracking-[0.18em] text-clay">
          Hidden places · {here.length} of {country.placeCount}
        </p>
        <h1 className="animate-float-in mt-3 font-display text-4xl text-forest sm:text-5xl">
          {country.name}
        </h1>

        <nav className="mt-5 flex flex-wrap gap-2">
          {countries.map((c) => (
            <Link
              key={c.id}
              href={`/explore/map?country=${c.slug}`}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                c.slug === country.slug
                  ? "border-clay bg-clay text-cream"
                  : "border-ink/12 bg-cream text-forest hover:border-clay"
              }`}
            >
              {c.emoji} {c.name}
            </Link>
          ))}
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-md border border-leaf-300 bg-leaf-100 p-4 shadow-sm">
            <RouteMap countryCode={country.code} stops={stops} />
          </div>

          <div className="space-y-4">
            {here.length === 0 ? (
              <p className="rounded-md border border-ink/[0.08] bg-cream p-6 text-sm text-neutral-700 shadow-sm">
                No hidden places mapped in {country.name} yet.
              </p>
            ) : (
              here.map((place, i) => (
                <Reveal key={place.id} delay={i * 80}>
                  <Link
                    href={`/country/${place.countrySlug}/${place.citySlug}`}
                    className="flex gap-4 overflow-hidden rounded-md border border-ink/[0.08] bg-cream shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="h-24 w-28 shrink-0 bg-surface">
                      {photos[i] && (
                        <img
                          src={photos[i]!.url}
                          alt=""
                          className="washed h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 py-3 pr-4">
                      <span className="text-[11px] uppercase tracking-wide text-leaf-700">
                        {place.cityName} · hidden
                      </span>
                      <span className="mt-0.5 block font-display text-lg text-forest">
                        {place.name}
                      </span>
                      {place.summary && (
                        <span className="mt-0.5 block text-sm text-neutral-700">
                          {place.summary}
                        </span>
                      )}
                    </span>
                  </Link>
                </Reveal>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
