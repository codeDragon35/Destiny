import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountryBySlug, listCitiesForCountry } from "@/modules/destination/queries";

export const dynamic = "force-dynamic";

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) notFound();

  const cities = await listCitiesForCountry(country.id);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link href="/" className="text-sm text-soft-gray transition hover:text-jade">
        ← All countries
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <span className="text-5xl">{country.emoji}</span>
        <h1 className="text-4xl font-semibold text-ivory">{country.name}</h1>
      </div>
      {country.summary && <p className="mt-4 max-w-2xl text-soft-gray">{country.summary}</p>}

      <h2 className="mt-14 text-sm uppercase tracking-[0.2em] text-jade">Cities</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {cities.map((city) => (
          <li key={city.id}>
            <Link
              href={`/country/${country.slug}/${city.slug}`}
              className="block rounded-xl border border-white/5 bg-midnight p-6 transition hover:border-jade/60"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-xl font-medium text-ivory">{city.name}</h3>
                <span className="shrink-0 text-sm text-gold">{city.placeCount} places</span>
              </div>
              {city.summary && (
                <p className="mt-3 text-sm leading-relaxed text-soft-gray">{city.summary}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
