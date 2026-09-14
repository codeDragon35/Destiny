import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Reveal from "@/components/Reveal";
import { auth, signOut } from "@/auth";
import { listTripsForUser, passportSummary } from "@/modules/trip/queries";

export const dynamic = "force-dynamic";

/** Profile & travel stats. */
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?from=/profile");

  const [trips, summary] = await Promise.all([
    listTripsForUser(session.user.id),
    passportSummary(session.user.id),
  ]);

  const days = trips.reduce((n, t) => n + t.days, 0);
  const visited = trips.reduce((n, t) => n + t.visited, 0);

  const stats = [
    { label: "Journeys", value: trips.length },
    { label: "Days travelled", value: days },
    { label: "Places visited", value: visited },
    { label: "Stamps", value: summary.stamps },
  ];

  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-10 sm:px-10">
        <div className="flex flex-wrap items-center gap-5">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-forest font-display text-2xl text-cream">
            {session.user.email?.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-4xl text-forest">
              {session.user.email?.split("@")[0]}
            </h1>
            <p className="text-sm text-neutral-600">{session.user.email}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 70} className="h-full">
              <div className="h-full rounded-md border border-ink/[0.08] bg-cream p-5 shadow-sm">
                <p className="font-display text-3xl text-clay">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-neutral-600">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/passport"
            className="rounded-md bg-clay px-6 py-2.5 font-display text-sm text-cream transition hover:bg-accent-600"
          >
            Open passport
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-ink/15 px-6 py-2.5 font-display text-sm text-forest transition hover:bg-surface"
            >
              Sign out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
