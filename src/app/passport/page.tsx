import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Reveal from "@/components/Reveal";
import Sparkles from "@/components/Sparkles";
import { auth } from "@/auth";
import { listTripsForUser, passportSummary } from "@/modules/trip/queries";

export const dynamic = "force-dynamic";

/** Passport index — every journey a signed-in traveller has stamped. */
export default async function PassportIndexPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?from=/passport");

  const [trips, summary] = await Promise.all([
    listTripsForUser(session.user.id),
    passportSummary(session.user.id),
  ]);

  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-10 sm:px-10">
        <div className="relative overflow-hidden rounded-md bg-forest p-8 text-cream shadow-lg sm:p-10">
          <Sparkles />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.2em] text-cream/60">
              Travel Passport
            </p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">
              {summary.stamps} stamps
            </h1>
            <p className="mt-1 text-sm text-cream/70">
              across {summary.countries} {summary.countries === 1 ? "country" : "countries"} ·{" "}
              {trips.length} {trips.length === 1 ? "journey" : "journeys"}
            </p>
          </div>
        </div>

        {trips.length === 0 ? (
          <div className="mt-10 rounded-md border border-ink/[0.08] bg-cream p-8 text-center shadow-sm">
            <p className="text-neutral-700">No journeys stamped yet.</p>
            <Link
              href="/plan"
              className="mt-4 inline-block rounded-md bg-clay px-6 py-2.5 font-display text-sm text-cream transition hover:bg-accent-600"
            >
              Plan your first
            </Link>
          </div>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {trips.map((trip, i) => (
              <Reveal key={trip.slug} delay={i * 80} className="h-full">
                <Link
                  href={`/trip/${trip.slug}/passport`}
                  className="flex h-full items-center justify-between gap-4 rounded-md border border-ink/[0.08] bg-cream px-6 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex items-center gap-4">
                    <span className="text-3xl" aria-hidden>
                      {trip.countryEmoji}
                    </span>
                    <span>
                      <span className="block font-display text-lg text-forest">
                        {trip.days} days in {trip.countryName}
                      </span>
                      <span className="mt-0.5 block text-xs text-neutral-600">
                        {trip.visited} visited · {trip.collected} collected
                      </span>
                    </span>
                  </span>
                  <span className="text-clay" aria-hidden>
                    →
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
