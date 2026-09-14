import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Reveal from "@/components/Reveal";
import { listCountries } from "@/modules/destination/queries";
import { getPhoto } from "@/modules/media/wikimedia";

export const dynamic = "force-dynamic";

export default async function PlanIndexPage() {
  const countries = await listCountries();
  const photos = await Promise.all(
    countries.map((c) => getPhoto("countries", c.id, c.name, c.wikidataId)),
  );

  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-10 sm:px-10">
        <p className="text-xs uppercase tracking-[0.18em] text-clay">Plan</p>
        <h1 className="animate-float-in mt-3 font-display text-4xl text-forest sm:text-5xl">
          Where are you going?
        </h1>
        <p className="mt-3 max-w-md text-neutral-700">
          Pick a country and tell Destiny how you travel. It builds the days around you.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {countries.map((country, i) => (
            <Reveal key={country.id} delay={i * 80} className="h-full">
              <Link
                href={`/country/${country.slug}/plan`}
                className="group block h-full overflow-hidden rounded-md border border-ink/[0.08] bg-cream shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-32 overflow-hidden bg-surface">
                  {photos[i] && (
                    <img
                      src={photos[i]!.url}
                      alt=""
                      className="washed h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="px-4 py-3">
                  <p className="font-display text-lg text-forest">
                    {country.emoji} {country.name}
                  </p>
                  <p className="text-xs text-neutral-600">{country.placeCount} places mapped</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </main>
    </div>
  );
}
