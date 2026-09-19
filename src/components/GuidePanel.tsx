"use client";

import { useEffect, useState } from "react";
import type { GuideView } from "@/modules/trip/guide";

/**
 * The guide as a slide-in panel over the itinerary. The same content also has a
 * full page at /trip/[slug]/guide, which this links to in a new tab for a
 * longer read — two ways in, one shared `GuideView` behind both.
 */
export default function GuidePanel({
  view,
  tripSlug,
  countryName,
  countrySlug,
  days,
  accentHex,
}: {
  view: GuideView;
  tripSlug: string;
  countryName: string;
  countrySlug: string;
  days: number;
  accentHex: string;
}) {
  const [open, setOpen] = useState(false);

  // Escape closes, and the page behind must not scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-forest/30 px-6 py-2.5 font-display text-sm text-forest transition hover:bg-surface"
      >
        Ask the guide
      </button>

      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Travel guide">
          <button
            type="button"
            aria-label="Close guide"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-ink/25"
          />

          <aside className="animate-slide-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-paper shadow-lg sm:w-[32%] sm:min-w-[380px]">
            <header className="flex items-start justify-between gap-3 border-b border-ink/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-leaf-300 font-display text-forest">
                  ✦
                </span>
                <div>
                  <p className="font-display text-base text-forest">Destiny</p>
                  <p className="text-[11px] text-neutral-600">
                    {countryName}, {days} days
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-xl leading-none text-neutral-500 transition hover:text-forest"
              >
                ×
              </button>
            </header>

            <div className="flex-1 space-y-4 px-6 py-5">
              <div className="rounded-md rounded-bl-sm bg-cream px-4 py-3 shadow-sm">
                <p className="text-sm text-ink">
                  I don&apos;t search listings — I build the journey. Here&apos;s what I did with
                  what you told me.
                </p>
              </div>

              {view.asked && (
                <div className="ml-auto w-fit max-w-[85%] rounded-md rounded-br-sm bg-surface px-4 py-3">
                  <p className="text-sm text-ink">{view.asked}</p>
                </div>
              )}

              <div className="rounded-md rounded-bl-sm bg-forest px-5 py-4 text-cream shadow-md">
                <p className="text-sm leading-relaxed">{view.reply.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-cream/15 px-3 py-1 text-xs">
                    {view.cities.length} {view.cities.length === 1 ? "base" : "bases"}
                  </span>
                  <span className="rounded-full bg-cream/15 px-3 py-1 text-xs">
                    {view.placeCount} places
                  </span>
                  <span className="rounded-full bg-cream/15 px-3 py-1 text-xs">{view.pace}</span>
                </div>
              </div>

              {view.chosen.length > 0 && (
                <div className="rounded-md border border-ink/[0.08] bg-cream p-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">
                    What I picked
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {view.chosen.map((d) => (
                      <li key={d.day}>
                        <span className="text-neutral-500">Day {d.day}</span>{" "}
                        <span className="text-forest">{d.places.join(", ")}</span>
                        <span className="text-neutral-500"> · {d.cityName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {view.split.length > 0 && (
                <div className="rounded-md border border-ink/[0.08] bg-cream p-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">
                    Budget split
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {view.split.map((row) => (
                      <li key={row.label} className="flex justify-between">
                        <span className="text-neutral-600">{row.label}</span>
                        <span className="text-forest">₹{row.amount.toLocaleString("en-IN")}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-neutral-500">Indicative, not booked.</p>
                </div>
              )}

              {view.hiddenNames.length > 0 && (
                <div className="rounded-md border border-leaf-300 bg-leaf-100 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-leaf-700">
                    Hidden places folded in
                  </p>
                  <p className="mt-1 text-sm text-forest">{view.hiddenNames.join(", ")}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {view.reply.chips.map((chip) => (
                  <a
                    key={chip.label}
                    href={`/country/${countrySlug}/plan${chip.param ? `?${chip.param}` : ""}`}
                    className="rounded-full border border-ink/12 bg-cream px-3 py-1.5 text-xs text-neutral-600 transition hover:border-clay hover:text-forest"
                  >
                    {chip.label}
                  </a>
                ))}
              </div>
            </div>

            <footer className="border-t border-ink/10 px-6 py-4">
              <a
                href={`/trip/${tripSlug}/guide`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm transition hover:underline"
                style={{ color: accentHex }}
              >
                Discuss in a new tab
                <span aria-hidden>↗</span>
              </a>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
