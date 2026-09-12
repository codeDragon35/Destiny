import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listTripsForUser } from "@/modules/trip/queries";

export const dynamic = "force-dynamic";

export default async function MyTripsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?from=/trips");

  const trips = await listTripsForUser(session.user.id);

  return (
    <main className="min-h-dvh bg-space">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <Link href="/" className="text-sm text-soft-gray transition hover:text-jade">
          ← Destiny
        </Link>

        <h1 className="mt-10 font-display text-4xl font-semibold text-ivory sm:text-5xl">My trips</h1>
        <p className="mt-3 text-sm text-soft-gray">{session.user.email}</p>

        {trips.length === 0 ? (
          <div className="mt-14 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-midnight to-dusk/40 p-8 text-center">
            <p className="text-soft-gray">You haven&apos;t planned a trip yet.</p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-full bg-jade px-6 py-2.5 text-sm font-medium text-space transition hover:bg-jade/90"
            >
              Explore the globe
            </Link>
          </div>
        ) : (
          <ul className="mt-14 space-y-4">
            {trips.map((trip) => (
              <li key={trip.slug}>
                <Link
                  href={`/trip/${trip.slug}`}
                  className="group flex items-center justify-between gap-6 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-midnight to-dusk/40 px-6 py-5 transition hover:border-jade/40"
                >
                  <span className="flex items-center gap-4">
                    <span className="text-3xl" aria-hidden>
                      {trip.countryEmoji}
                    </span>
                    <span>
                      <span className="block text-lg text-ivory transition group-hover:text-jade">
                        {trip.days} days in {trip.countryName}
                      </span>
                      <span className="mt-0.5 block text-xs text-soft-gray">
                        {trip.visited} visited · {trip.collected} collected
                      </span>
                    </span>
                  </span>
                  <span className="text-soft-gray transition group-hover:translate-x-1" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
