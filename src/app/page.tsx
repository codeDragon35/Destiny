import Link from "next/link";
import { listCountries } from "@/modules/destination/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const countries = await listCountries();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-jade">Destiny</p>
      <h1 className="mt-3 text-4xl font-semibold text-ivory">Choose a country</h1>
      <p className="mt-3 max-w-xl text-soft-gray">
        Pick a destination to explore its cities, landmarks and hidden places.
      </p>

      {countries.length === 0 ? (
        <p className="mt-12 rounded-lg border border-midnight bg-midnight/40 p-6 text-soft-gray">
          No countries seeded yet. Run <code className="text-gold">npm run db:seed</code>.
        </p>
      ) : (
        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {countries.map((country) => (
            <li key={country.id}>
              <Link
                href={`/country/${country.slug}`}
                className="block rounded-xl border border-white/5 bg-midnight p-6 transition hover:border-jade/60"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.emoji}</span>
                  <h2 className="text-xl font-medium text-ivory">{country.name}</h2>
                </div>
                {country.summary && (
                  <p className="mt-3 text-sm leading-relaxed text-soft-gray">{country.summary}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
