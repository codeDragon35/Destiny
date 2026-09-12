import Link from "next/link";
import GlobeShell from "@/components/GlobeShell";
import AuthNav from "@/components/AuthNav";
import { listCountries } from "@/modules/destination/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const countries = await listCountries();
  const available = countries
    .filter((c) => c.lat !== null && c.lng !== null)
    .map((c) => ({ code: c.code, slug: c.slug, lat: c.lat!, lng: c.lng! }));

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-space">
      <AuthNav />
      <div className="absolute inset-0">
        <GlobeShell available={available} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 p-6 sm:p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-jade">Destiny</p>
        <h1 className="mt-3 max-w-md text-3xl font-semibold leading-tight text-ivory sm:text-4xl">
          Choose a country
        </h1>
        <p className="mt-2 max-w-sm text-sm text-soft-gray">
          Spin the globe and pick a destination to start your journey.
        </p>
      </div>

      {/* Keyboard-accessible equivalent of clicking the globe. */}
      <nav className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
        <ul className="flex flex-wrap gap-3">
          {countries.map((country) => (
            <li key={country.id}>
              <Link
                href={`/country/${country.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-jade/30 bg-midnight/80 px-4 py-2 text-sm text-ivory backdrop-blur transition hover:border-jade"
              >
                <span>{country.emoji}</span>
                {country.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
