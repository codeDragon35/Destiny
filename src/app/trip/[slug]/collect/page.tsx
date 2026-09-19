import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { kindOf } from "@/components/CollectibleBadge";
import { tripAccess } from "@/modules/trip/access";
import { collectiblesByPlaceIds } from "@/modules/souvenir/queries";
import { getProgress, setProgress } from "@/modules/passport/queries";
import { listMemories, addMemory } from "@/modules/passport/memories";
import { storeImage } from "@/modules/media/storage";
import { getPhoto } from "@/modules/media/wikimedia";
import { activitiesByPlaceIds } from "@/modules/destination/queries";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  attraction: "Attraction",
  nature: "Nature",
  culture: "Culture",
  food: "Food",
  hidden_gem: "Hidden gem",
};

export default async function CollectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await tripAccess(slug);
  if (!access) notFound();
  const { trip, canEdit } = access;
  // Someone else's trip is readable, never editable.
  if (!canEdit) redirect(`/trip/${slug}/passport`);

  const days = trip.plan.days ?? [];
  const placeIds = days.flatMap((d) => d.places.map((p) => p.id));
  const [collectibles, progress, memories, activitiesByPlace] = await Promise.all([
    collectiblesByPlaceIds(placeIds),
    getProgress(trip.id),
    listMemories(trip.id),
    activitiesByPlaceIds(placeIds),
  ]);
  const allPlaces = days.flatMap((d) => d.places);

  // Only the activities the traveller planned, so this page mirrors the itinerary.
  const chosenIds = new Set(trip.activityIds ?? []);
  const chosenActivities = new Map(
    [...activitiesByPlace.entries()].map(([id, list]) => [
      id,
      list.filter((a) => chosenIds.has(a.id)),
    ]),
  );

  const photoList = await Promise.all(
    allPlaces.map((p) => getPhoto("places", p.id, p.name, p.wikidataId).catch(() => null)),
  );
  const photos = new Map(allPlaces.map((p, i) => [p.id, photoList[i]]));

  // One section per city, in itinerary order.
  const cities = new Map<string, typeof allPlaces>();
  for (const day of days) {
    const list = cities.get(day.cityName) ?? [];
    for (const place of day.places) {
      if (!list.some((p) => p.id === place.id)) list.push(place);
    }
    cities.set(day.cityName, list);
  }

  async function save(formData: FormData) {
    "use server";
    const target = await tripAccess(slug);
    if (!target) notFound();
    // Re-check on write: the page render is not a security boundary.
    if (!target.canEdit) redirect(`/trip/${slug}/passport`);
    await setProgress(
      target.trip.id,
      formData.getAll("place").map(String),
      formData.getAll("collectible").map(String),
    );
    redirect(`/trip/${slug}/passport`);
  }

  async function addNote(formData: FormData) {
    "use server";
    const target = await tripAccess(slug);
    if (!target) notFound();
    if (!target.canEdit || !target.userId) redirect(`/trip/${slug}/passport`);

    const file = formData.get("photo");
    const note = String(formData.get("note") ?? "").trim();
    const placeId = String(formData.get("placeId") ?? "") || null;

    const imagePath =
      file instanceof File && file.size > 0 ? await storeImage(file) : null;
    if (!imagePath && !note) return;

    await addMemory({
      tripId: target.trip.id,
      userId: target.userId,
      placeId,
      imagePath,
      note: note || null,
    });
    revalidatePath(`/trip/${slug}/collect`);
  }

  return (
    <main className="min-h-dvh bg-paper">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <Link href={`/trip/${slug}`} className="text-sm text-neutral-600 transition hover:text-clay">
          ← Itinerary
        </Link>

        <p className="mt-10 text-xs uppercase tracking-[0.35em] text-clay">Your journey</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-forest sm:text-5xl">
          What did you see and collect?
        </h1>
        <p className="mt-4 text-neutral-600">
          Tick everything you managed — we&apos;ll turn it into your passport.
        </p>

        <form action={save} className="mt-12">
          <div className="space-y-10">
            {[...cities.entries()].map(([cityName, places]) => {
              const cityCollectibles = places.flatMap((p) => collectibles.get(p.id) ?? []);
              return (
                <section key={cityName}>
                  <div className="flex items-baseline gap-3">
                    <h2 className="font-display text-xl font-medium text-forest">{cityName}</h2>
                    <span className="h-px flex-1 bg-ink/5" />
                  </div>

                  <div className="mt-4 space-y-2">
                    {places.map((place) => {
                      const photo = photos.get(place.id);
                      const acts = chosenActivities.get(place.id) ?? [];
                      return (
                        <label
                          key={place.id}
                          className="flex cursor-pointer gap-4 overflow-hidden rounded-xl border border-ink/[0.08] bg-cream p-4 transition hover:border-clay/40 has-[:checked]:border-clay/50 has-[:checked]:bg-clay/[0.06]"
                        >
                          <input
                            type="checkbox"
                            name="place"
                            value={place.id}
                            defaultChecked={progress.places.has(place.id)}
                            className="mt-1 h-4 w-4 shrink-0 accent-[#C67139]"
                          />

                          <span className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-surface">
                            {photo && (
                              <img src={photo.url} alt="" className="washed h-full w-full object-cover" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-baseline gap-x-2">
                              <span className="text-forest">{place.name}</span>
                              <span className="text-xs text-neutral-500">
                                {KIND_LABEL[place.kind] ?? place.kind}
                                {place.visitMinutes
                                  ? ` · ${(place.visitMinutes / 60).toFixed(1).replace(/\.0$/, "")}h`
                                  : ""}
                              </span>
                            </span>
                            {place.summary && (
                              <span className="mt-0.5 block text-xs text-neutral-600">
                                {place.summary}
                              </span>
                            )}
                            {acts.length > 0 && (
                              <span className="mt-1.5 block text-xs text-clay">
                                {acts.map((a) => a.name).join(" · ")}
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {cityCollectibles.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {cityCollectibles.map((item) => (
                        <label
                          key={item.id}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-clay/25 px-5 py-3 transition hover:border-clay/50 has-[:checked]:border-solid has-[:checked]:border-clay/60 has-[:checked]:bg-clay/[0.07]"
                        >
                          <input
                            type="checkbox"
                            name="collectible"
                            value={item.id}
                            defaultChecked={progress.collectibles.has(item.id)}
                            className="mt-1 h-4 w-4 accent-[#C67139]"
                          />
                          <span>
                            <span className="text-sm text-neutral-600">
                              <span aria-hidden className="mr-1 text-clay">
                                {kindOf(item.kind).icon}
                              </span>
                              {item.name}
                            </span>
                            {item.whereToGet && (
                              <span className="mt-0.5 block text-xs text-neutral-600/60">
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
            className="mt-12 rounded-full bg-clay px-8 py-3 font-medium text-cream transition hover:bg-clay/90"
          >
            Next — create my passport →
          </button>
        </form>

        <section className="mt-20 border-t border-ink/[0.08] pt-12">
          <h2 className="font-display text-xl font-medium text-forest">Your photos &amp; notes</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Add your own pictures and memories — they go into your passport.
          </p>

          {memories.length > 0 && (
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {memories.map((m) => (
                <li
                  key={m.id}
                  className="overflow-hidden rounded-xl border border-ink/[0.08] bg-cream"
                >
                  {m.imagePath && (
                    <img
                      src={`/api/uploads/${m.imagePath}`}
                      alt=""
                      className="washed h-32 w-full object-cover"
                    />
                  )}
                  {m.note && <p className="px-4 py-3 text-sm text-neutral-600">{m.note}</p>}
                </li>
              ))}
            </ul>
          )}

          {access.userId ? (
            <form action={addNote} className="mt-6 space-y-4">
              <select
                name="placeId"
                className="w-full rounded-lg border border-ink/12 bg-cream px-4 py-3 text-forest outline-none focus:border-clay"
              >
                <option value="">Anywhere on this trip</option>
                {allPlaces.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}
                  </option>
                ))}
              </select>
              <textarea
                name="note"
                rows={3}
                placeholder="What do you want to remember?"
                className="w-full rounded-lg border border-ink/12 bg-cream px-4 py-3 text-forest placeholder:text-neutral-600/50 outline-none focus:border-clay"
              />
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full text-sm text-neutral-600 file:mr-4 file:rounded-full file:border-0 file:bg-clay/15 file:px-5 file:py-2 file:text-clay"
              />
              <button
                type="submit"
                className="rounded-full border border-clay/40 px-6 py-2.5 text-sm text-clay transition hover:border-clay"
              >
                Add to my journey
              </button>
            </form>
          ) : (
            <p className="mt-6 rounded-xl border border-ink/[0.08] bg-cream px-5 py-4 text-sm text-neutral-600">
              <Link href={`/signin?from=/trip/${slug}/collect`} className="text-clay">
                Sign in
              </Link>{" "}
              to add your own photos and notes.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
