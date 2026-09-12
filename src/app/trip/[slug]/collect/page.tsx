import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { kindOf } from "@/components/CollectibleBadge";
import { getTripBySlug } from "@/modules/trip/queries";
import { collectiblesByPlaceIds } from "@/modules/souvenir/queries";
import { getProgress, setProgress } from "@/modules/passport/queries";

export const dynamic = "force-dynamic";

export default async function CollectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  const days = trip.plan.days ?? [];
  const placeIds = days.flatMap((d) => d.places.map((p) => p.id));
  const [collectibles, progress] = await Promise.all([
    collectiblesByPlaceIds(placeIds),
    getProgress(trip.id),
  ]);

  // One section per city, in itinerary order.
  const cities = new Map<string, { id: string; name: string }[]>();
  for (const day of days) {
    const list = cities.get(day.cityName) ?? [];
    for (const place of day.places) {
      if (!list.some((p) => p.id === place.id)) list.push({ id: place.id, name: place.name });
    }
    cities.set(day.cityName, list);
  }

  async function save(formData: FormData) {
    "use server";
    const target = await getTripBySlug(slug);
    if (!target) notFound();
    await setProgress(
      target.id,
      formData.getAll("place").map(String),
      formData.getAll("collectible").map(String),
    );
    redirect(`/trip/${slug}/passport`);
  }

  return (
    <main className="min-h-dvh bg-space">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <Link href={`/trip/${slug}`} className="text-sm text-soft-gray transition hover:text-jade">
          ← Itinerary
        </Link>

        <p className="mt-10 text-xs uppercase tracking-[0.35em] text-jade">Your journey</p>
        <h1 className="mt-4 text-4xl font-semibold text-ivory sm:text-5xl">
          What did you see and collect?
        </h1>
        <p className="mt-4 text-soft-gray">
          Tick everything you managed — we&apos;ll turn it into your passport.
        </p>

        <form action={save} className="mt-12">
          <div className="space-y-10">
            {[...cities.entries()].map(([cityName, places]) => {
              const cityCollectibles = places.flatMap((p) => collectibles.get(p.id) ?? []);
              return (
                <section key={cityName}>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-xl font-medium text-ivory">{cityName}</h2>
                    <span className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="mt-4 space-y-2">
                    {places.map((place) => (
                      <label
                        key={place.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-midnight px-5 py-3 transition hover:border-jade/40 has-[:checked]:border-jade/50 has-[:checked]:bg-jade/[0.06]"
                      >
                        <input
                          type="checkbox"
                          name="place"
                          value={place.id}
                          defaultChecked={progress.places.has(place.id)}
                          className="h-4 w-4 accent-jade"
                        />
                        <span className="text-soft-gray">{place.name}</span>
                      </label>
                    ))}
                  </div>

                  {cityCollectibles.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {cityCollectibles.map((item) => (
                        <label
                          key={item.id}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-gold/25 px-5 py-3 transition hover:border-gold/50 has-[:checked]:border-solid has-[:checked]:border-gold/60 has-[:checked]:bg-gold/[0.07]"
                        >
                          <input
                            type="checkbox"
                            name="collectible"
                            value={item.id}
                            defaultChecked={progress.collectibles.has(item.id)}
                            className="mt-1 h-4 w-4 accent-[#F4C95D]"
                          />
                          <span>
                            <span className="text-sm text-soft-gray">
                              <span aria-hidden className="mr-1 text-gold">
                                {kindOf(item.kind).icon}
                              </span>
                              {item.name}
                            </span>
                            {item.whereToGet && (
                              <span className="mt-0.5 block text-xs text-soft-gray/60">
                                {item.whereToGet}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <button
            type="submit"
            className="mt-12 rounded-full bg-gold px-8 py-3 font-medium text-space transition hover:bg-gold/90"
          >
            Next — create my passport →
          </button>
        </form>
      </div>
    </main>
  );
}
