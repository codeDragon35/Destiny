import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Reveal from "@/components/Reveal";
import { getTripBySlug } from "@/modules/trip/queries";
import { guideView } from "@/modules/trip/guide";
import { getCountryBySlug } from "@/modules/destination/queries";
import { accentFor } from "@/lib/accent";

export const dynamic = "force-dynamic";

/**
 * Screen 1e — the planning conversation. Replies come from the deterministic
 * planner, not a model, so every figure shown is real.
 */
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  const country = await getCountryBySlug(trip.countrySlug);
  const accent = accentFor(country?.motif);
  const days = trip.plan.days ?? [];
  // Same shape the side panel renders, so the two surfaces cannot drift apart.
  const { reply, asked, cities, placeCount, split, pace, hiddenNames } = guideView(trip);

  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-8 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-leaf-300 font-display text-forest">
              ✦
            </span>
            <div>
              <p className="font-display text-lg text-forest">Destiny</p>
              <p className="text-xs text-neutral-600">
                Your travel guide · planning {trip.countryName}, {trip.days} days
              </p>
            </div>
          </div>
          <Link
            href={`/country/${trip.countrySlug}/plan`}
            className="text-xs text-neutral-600 transition hover:text-clay"
          >
            Start over
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              Today
            </p>

            <Reveal>
              <div className="mt-5 max-w-xl rounded-md rounded-bl-sm bg-cream px-5 py-4 shadow-sm">
                <p className="text-sm text-ink">
                  I&apos;m Destiny. I don&apos;t search listings — I build the journey. Tell me how
                  long you have, what you can spend, and what you actually like.
                </p>
              </div>
            </Reveal>

            {asked && (
              <Reveal delay={120}>
                <div className="ml-auto mt-4 max-w-md rounded-md rounded-br-sm bg-surface px-5 py-4">
                  <p className="text-sm text-ink">{asked}</p>
                </div>
              </Reveal>
            )}

            <Reveal delay={240}>
              <div className="mt-4 max-w-2xl rounded-md rounded-bl-sm bg-forest px-6 py-5 text-cream shadow-md">
                <p className="text-sm leading-relaxed">{reply.text}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-cream/15 px-3 py-1 text-xs">
                    {days.length} days
                  </span>
                  <span className="rounded-full bg-cream/15 px-3 py-1 text-xs">
                    {placeCount} places
                  </span>
                  {trip.budget && (
                    <span className="rounded-full bg-clay px-3 py-1 text-xs text-cream">
                      ₹{trip.budget.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            </Reveal>

            <Reveal delay={360}>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-md border border-ink/[0.08] bg-cream px-6 py-5 shadow-sm">
                <div>
                  <p className="font-display text-xl text-forest">{cities.join(" → ")}</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    {trip.days} days · {cities.length}{" "}
                    {cities.length === 1 ? "base" : "bases"} · {placeCount} places
                    {trip.dietary ? ` · ${trip.dietary}` : ""}
                  </p>
                </div>
                <Link
                  href={`/trip/${trip.slug}`}
                  className="rounded-full px-5 py-2.5 font-display text-sm text-cream transition hover:opacity-90"
                  style={{ backgroundColor: accent.hex }}
                >
                  Open journey
                </Link>
              </div>
            </Reveal>

            <div className="mt-5 flex flex-wrap gap-2">
              {reply.chips.map((chip) => (
                <Link
                  key={chip.label}
                  href={`/country/${trip.countrySlug}/plan${chip.param ? `?${chip.param}` : ""}`}
                  className="rounded-full border border-ink/12 bg-cream px-4 py-1.5 text-sm text-neutral-700 transition hover:border-clay hover:text-forest"
                >
                  {chip.label}
                </Link>
              ))}
            </div>

            <p className="mt-6 rounded-md border border-dashed border-ink/15 px-5 py-3 text-sm text-neutral-500">
              Tell the guide more… <span className="text-neutral-400">(coming soon)</span>
            </p>
          </div>

          <aside className="space-y-4">
            <div className="rounded-md border border-ink/[0.08] bg-cream p-5 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">
                What the guide is working with
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Days</dt>
                  <dd className="text-forest">{trip.days}</dd>
                </div>
                {trip.budget && (
                  <div className="flex justify-between">
                    <dt className="text-neutral-600">Budget</dt>
                    <dd className="text-forest">₹{trip.budget.toLocaleString("en-IN")}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Pace</dt>
                  <dd className="text-forest">{pace}</dd>
                </div>
              </dl>
            </div>

            {split.length > 0 && (
              <div className="rounded-md border border-ink/[0.08] bg-cream p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">
                  Budget split
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {split.map((row) => (
                    <li key={row.label} className="flex justify-between">
                      <span className="text-neutral-600">{row.label}</span>
                      <span className="text-forest">₹{row.amount.toLocaleString("en-IN")}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-neutral-500">
                  Indicative split, not booked prices.
                </p>
              </div>
            )}

            <div className="rounded-md border border-leaf-300 bg-leaf-100 p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-leaf-700">
                Saved from the map
              </p>
              <p className="mt-2 text-sm text-forest">
                {hiddenNames.length} hidden places folded in
              </p>
              <p className="mt-1 text-xs text-neutral-700">
                {hiddenNames.join(", ") || "None on this route yet"}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
