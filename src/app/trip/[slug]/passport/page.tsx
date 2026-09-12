import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Reveal from "@/components/Reveal";
import { kindOf } from "@/components/CollectibleBadge";
import { getTripBySlug } from "@/modules/trip/queries";
import { collectiblesByPlaceIds, type Collectible } from "@/modules/souvenir/queries";
import { getProgress, toggleProgress } from "@/modules/passport/queries";

export const dynamic = "force-dynamic";

type CityChapter = {
  cityName: string;
  places: { id: string; name: string; kind: string; summary: string | null }[];
  collectibles: Collectible[];
};

export default async function PassportPage({
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

  // Collapse the day-by-day plan into one chapter per city.
  const chapters = new Map<string, CityChapter>();
  for (const day of days) {
    const chapter = chapters.get(day.cityName) ?? {
      cityName: day.cityName,
      places: [],
      collectibles: [],
    };
    for (const place of day.places) {
      if (chapter.places.some((p) => p.id === place.id)) continue;
      chapter.places.push({
        id: place.id,
        name: place.name,
        kind: place.kind,
        summary: place.summary,
      });
      chapter.collectibles.push(...(collectibles.get(place.id) ?? []));
    }
    chapters.set(day.cityName, chapter);
  }

  const allCollectibles = [...chapters.values()].flatMap((c) => c.collectibles);
  const visited = progress.places.size;
  const collected = progress.collectibles.size;
  const year = new Date().getFullYear();

  async function toggle(formData: FormData) {
    "use server";
    const target = await getTripBySlug(slug);
    if (!target) notFound();
    const kind = formData.get("kind") === "place" ? "place" : "collectible";
    const id = String(formData.get("id"));
    await toggleProgress(target.id, kind, id);
    revalidatePath(`/trip/${slug}/passport`);
  }

  return (
    <main className="min-h-dvh bg-space">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <Link href={`/trip/${slug}`} className="text-sm text-soft-gray transition hover:text-jade">
          ← Itinerary
        </Link>

        <header className="mt-10 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/[0.07] to-transparent p-8 sm:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Travel passport</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-ivory sm:text-5xl">
            My {trip.countryName} Journey — {year}
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-soft-gray">
            <span>
              <span className="text-ivory">{visited}</span>/{placeIds.length} places visited
            </span>
            <span>
              <span className="text-gold">{collected}</span>/{allCollectibles.length} collected
            </span>
            <span>{chapters.size} cities</span>
          </div>
        </header>

        <div className="mt-14 space-y-12">
          {[...chapters.values()].map((chapter, ci) => (
            <Reveal key={chapter.cityName} delay={ci * 80}>
              <section>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-2xl font-medium text-ivory">{chapter.cityName}</h2>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <ul className="mt-5 space-y-2">
                  {chapter.places.map((place) => {
                    const done = progress.places.has(place.id);
                    return (
                      <li key={place.id}>
                        <form action={toggle}>
                          <input type="hidden" name="kind" value="place" />
                          <input type="hidden" name="id" value={place.id} />
                          <button
                            type="submit"
                            className={`flex w-full items-center gap-3 rounded-xl border px-5 py-3 text-left transition ${
                              done
                                ? "border-jade/40 bg-jade/[0.06]"
                                : "border-white/5 bg-midnight hover:border-white/15"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                                done ? "border-jade bg-jade text-space" : "border-soft-gray/40"
                              }`}
                              aria-hidden
                            >
                              {done ? "✓" : ""}
                            </span>
                            <span className={done ? "text-ivory" : "text-soft-gray"}>
                              {place.name}
                            </span>
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>

                {chapter.collectibles.length > 0 && (
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {chapter.collectibles.map((item) => {
                      const done = progress.collectibles.has(item.id);
                      return (
                        <li key={item.id}>
                          <form action={toggle}>
                            <input type="hidden" name="kind" value="collectible" />
                            <input type="hidden" name="id" value={item.id} />
                            <button
                              type="submit"
                              className={`flex h-full w-full items-start gap-3 rounded-xl border px-5 py-3 text-left transition ${
                                done
                                  ? "border-gold/50 bg-gold/[0.08]"
                                  : "border-dashed border-gold/20 bg-transparent hover:border-gold/40"
                              }`}
                            >
                              <span
                                className={`text-lg leading-none ${done ? "text-gold" : "text-gold/30"}`}
                                aria-hidden
                              >
                                {kindOf(item.kind).icon}
                              </span>
                              <span>
                                <span className={done ? "text-ivory" : "text-soft-gray"}>
                                  {item.name}
                                </span>
                                <span className="mt-0.5 block text-xs text-soft-gray/70">
                                  {done ? "Collected" : item.whereToGet}
                                </span>
                              </span>
                            </button>
                          </form>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </Reveal>
          ))}
        </div>

        <p className="mt-16 text-center text-sm text-soft-gray/60">
          Tap anything above to stamp it as done.
        </p>
      </div>
    </main>
  );
}
