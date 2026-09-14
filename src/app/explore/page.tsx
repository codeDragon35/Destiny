import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Reveal from "@/components/Reveal";
import { auth } from "@/auth";
import {
  listCountries,
  listHiddenPlaces,
} from "@/modules/destination/queries";
import { getPhoto } from "@/modules/media/wikimedia";
import { latestTripForUser, passportSummary } from "@/modules/trip/queries";
import { accentFor } from "@/lib/accent";

export const dynamic = "force-dynamic";

/** Screen 1b — the travel world. Sidebar rail, search, destination row, passport summary. */
export default async function ExplorePage() {
  const session = await auth();
  const [countries, hidden] = await Promise.all([
    listCountries(),
    listHiddenPlaces(2),
  ]);

  const [draft, passport] = session?.user?.id
    ? await Promise.all([
        latestTripForUser(session.user.id),
        passportSummary(session.user.id),
      ])
    : [null, { stamps: 0, countries: 0 }];

  const photos = await Promise.all(
    countries.map((c) => getPhoto("countries", c.id, c.name, c.wikidataId)),
  );

  const firstName = session?.user?.email?.split("@")[0] ?? "traveller";
  const greeting = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar />

      <main className="min-w-0 flex-1 px-6 py-8 sm:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <form action="/plan" className="min-w-0 flex-1">
            <input
              name="q"
              placeholder="Ask Destiny — &ldquo;quiet temples in autumn, under ₹2 lakh&rdquo;"
              className="w-full rounded-md border border-ink/10 bg-cream px-5 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-neutral-500 focus:border-clay"
            />
          </form>
          <span className="text-sm text-neutral-600">
            Saved {passport.stamps}
          </span>
          <Link
            href="/plan"
            className="rounded-md bg-forest px-5 py-3 font-display text-sm text-cream shadow-sm transition hover:bg-leaf-800"
          >
            New journey
          </Link>
        </div>

        <h1 className="animate-float-in mt-10 font-display text-4xl leading-tight text-forest sm:text-5xl">
          Namaste {greeting} — where shall we wander?
        </h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="grid gap-4 sm:grid-cols-3">
              {countries.slice(0, 3).map((country, i) => {
                const accent = accentFor(country.motif);
                const photo = photos[i];
                return (
                  <Reveal key={country.id} delay={i * 90} className="h-full">
                    <Link
                      href={`/country/${country.slug}`}
                      className="group block h-full overflow-hidden rounded-md border border-ink/[0.08] bg-cream shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="h-36 overflow-hidden bg-surface">
                        {photo && (
                          <img
                            src={photo.url}
                            alt=""
                            className="washed h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="flex items-baseline justify-between gap-2 px-4 py-3">
                        <span className="font-display text-lg text-forest">
                          {country.name}
                        </span>
                        <span className={`text-xs ${accent.text}`}>
                          {country.placeCount} places
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>

            <div className="mt-10 flex items-baseline justify-between">
              <h2 className="text-xs uppercase tracking-[0.18em] text-neutral-600">
                Hidden places near your taste
              </h2>
              <Link href="/explore/map" className="text-xs text-clay hover:underline">
                See the map
              </Link>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {hidden.map((place, i) => (
                <Reveal key={place.id} delay={i * 90} className="h-full">
                  <Link
                    href={`/country/${place.countrySlug}/${place.citySlug}`}
                    className="block h-full rounded-md border border-leaf-300 bg-leaf-100 p-5 transition hover:border-leaf-500"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-leaf-700">
                      {place.cityName} · hidden
                    </p>
                    <h3 className="mt-1 font-display text-xl text-forest">{place.name}</h3>
                    {place.summary && (
                      <p className="mt-1 text-sm text-neutral-700">{place.summary}</p>
                    )}
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-md bg-forest p-5 text-cream shadow-md">
              <p className="text-[11px] uppercase tracking-[0.16em] text-cream/60">
                Continue planning
              </p>
              {draft ? (
                <>
                  <p className="mt-3 font-display text-xl">
                    {draft.countryName}, {draft.days} days
                  </p>
                  <p className="mt-1 text-xs text-cream/60">
                    Draft · {draft.visited} of {draft.totalPlaces} days done
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream/15">
                    <div
                      className="h-full rounded-full bg-clay"
                      style={{
                        width: `${Math.min(100, draft.totalPlaces ? (draft.visited / draft.totalPlaces) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                  <Link
                    href={`/trip/${draft.slug}`}
                    className="mt-4 inline-block rounded-md bg-clay px-5 py-2 font-display text-sm text-cream transition hover:bg-accent-600"
                  >
                    Resume
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm text-cream/75">
                    No journey in progress yet.
                  </p>
                  <Link
                    href="/plan"
                    className="mt-4 inline-block rounded-md bg-clay px-5 py-2 font-display text-sm text-cream transition hover:bg-accent-600"
                  >
                    Start one
                  </Link>
                </>
              )}
            </div>

            <div className="rounded-md border border-leaf-300 bg-leaf-100 p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-leaf-700">
                Your passport
              </p>
              <p className="mt-2 font-display text-4xl text-forest">{passport.stamps}</p>
              <p className="text-xs text-neutral-700">
                stamps in {passport.countries} {passport.countries === 1 ? "country" : "countries"}
              </p>
              <Link
                href="/passport"
                className="mt-3 inline-block text-xs text-clay hover:underline"
              >
                Open passport →
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
