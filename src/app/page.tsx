import Link from "next/link";
import GlobeShell from "@/components/GlobeShell";
import { listCountries } from "@/modules/destination/queries";
import Sparkles from "@/components/Sparkles";

export const dynamic = "force-dynamic";

/** Screen 1a — onboarding. Split layout: pitch on paper, globe on a leaf panel. */
export default async function OnboardingPage() {
  const countries = await listCountries();
  const available = countries
    .filter((c) => c.lat !== null && c.lng !== null)
    .map((c) => ({ code: c.code, slug: c.slug, lat: c.lat!, lng: c.lng! }));

  const placeCount = countries.reduce((n, c) => n + (c.placeCount ?? 0), 0);

  return (
    <main className="min-h-dvh bg-paper">
      <div className="mx-auto grid min-h-dvh max-w-6xl gap-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="flex flex-col justify-center px-8 py-14 sm:px-12">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-clay font-display text-cream">
              D
            </span>
            <span className="font-display text-xl text-forest">Destiny</span>
          </div>

          <p className="animate-float-in mt-10 text-xs uppercase tracking-[0.18em] text-clay">
            Step 1 of 3
          </p>
          <h1
            className="animate-float-in mt-3 font-display text-5xl leading-[1.02] text-forest sm:text-6xl"
            style={{ animationDelay: "120ms" }}
          >
            A world that plans itself around you.
          </h1>
          <p className="animate-float-in mt-6 max-w-sm text-neutral-700" style={{ animationDelay: "240ms" }}>
            Explore a destination, tell us how you travel, and Destiny builds the journey.
            Everything you collect along the way becomes your passport.
          </p>

          <ul className="mt-10 flex flex-wrap gap-3">
            {countries.map((country, i) => (
              <li
                key={country.id}
                className="animate-float-in"
                style={{ animationDelay: `${360 + i * 70}ms` }}
              >
                <Link
                  href={`/country/${country.slug}`}
                  className="inline-flex items-center gap-2 rounded-md border border-ink/10 bg-cream px-4 py-2 text-sm text-forest shadow-sm transition hover:border-clay"
                >
                  <span aria-hidden>{country.emoji}</span>
                  {country.name}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/explore"
            className="animate-float-in mt-10 inline-flex w-fit items-center gap-2 rounded-md bg-clay px-6 py-3 font-display text-cream shadow-md transition hover:bg-accent-600 hover:shadow-lg"
            style={{ animationDelay: "680ms" }}
          >
            Start exploring
            <span aria-hidden>→</span>
          </Link>
        </section>

        <section className="relative flex flex-col justify-center bg-leaf-200/70 px-6 py-14">
          <div className="relative h-[52vh] min-h-[340px] w-full">
            <GlobeShell available={available} />
          </div>

          <div className="relative mx-auto mt-6 w-fit overflow-hidden rounded-md bg-cream px-6 py-4 text-center shadow-md">
            <Sparkles />
            <p className="relative font-display text-3xl text-clay">{countries.length}</p>
            <p className="relative mt-1 max-w-[18ch] text-xs text-neutral-700">
              countries mapped with hidden places, not just landmarks
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-neutral-600">
            {placeCount} places mapped so far
          </p>
        </section>
      </div>
    </main>
  );
}
