import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import Sidebar from "@/components/Sidebar";
import {
  getCountryBySlug,
  listPlaceChoices,
  listCitiesForCountry,
  listPlacesForCity,
  activitiesByPlaceIds,
} from "@/modules/destination/queries";
import { planTrip, type Interest } from "@/modules/trip/planner";
import { saveTrip } from "@/modules/trip/queries";
import { auth } from "@/auth";
import { accentFor } from "@/lib/accent";

export const dynamic = "force-dynamic";

const INTERESTS: { value: Interest; label: string }[] = [
  { value: "nature", label: "Nature" },
  { value: "culture", label: "Culture" },
  { value: "food", label: "Food" },
  { value: "hidden_gem", label: "Hidden gems" },
];

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string; region?: string }>;
}) {
  const { slug } = await params;
  const { city: cityFilter, region: regionFilter } = await searchParams;
  const country = await getCountryBySlug(slug);
  if (!country) notFound();

  const all = await listPlaceChoices(country.id);
  const accent = accentFor(country.motif);

  // Arriving from a city or state page narrows the picker to just that place,
  // so a one-city trip does not mean scrolling the whole country.
  const choices = cityFilter
    ? all.filter((c) => c.citySlug === cityFilter)
    : regionFilter
      ? all.filter((c) => c.regionSlug === regionFilter)
      : all;

  const activities = await activitiesByPlaceIds(choices.map((c) => c.id));

  const scopeName = cityFilter
    ? choices[0]?.cityName
    : regionFilter
      ? choices[0]?.regionName
      : null;

  // Group by region, then city, so the picker mirrors how people think about a trip.
  const byRegion = new Map<string, { name: string; cities: Map<string, typeof choices> }>();
  for (const choice of choices) {
    const key = choice.regionSlug ?? "elsewhere";
    const region = byRegion.get(key) ?? {
      name: choice.regionName ?? "Elsewhere",
      cities: new Map<string, typeof choices>(),
    };
    const city = region.cities.get(choice.cityName) ?? [];
    city.push(choice);
    region.cities.set(choice.cityName, city);
    byRegion.set(key, region);
  }

  async function createTrip(formData: FormData) {
    "use server";
    const target = await getCountryBySlug(slug);
    if (!target) notFound();

    const days = Math.min(30, Math.max(1, Number(formData.get("days")) || 5));
    const picked = INTERESTS.map((i) => i.value).filter((v) => formData.get(v) === "on");
    const interests = picked.length > 0 ? picked : (["culture"] as Interest[]);
    const dietary = (formData.get("dietary") as string)?.trim() || null;
    const startDate = (formData.get("startDate") as string)?.trim() || null;
    const budgetRaw = Number(formData.get("budget"));
    const budget = Number.isFinite(budgetRaw) && budgetRaw > 0 ? Math.round(budgetRaw) : null;

    const chosenPlaces = formData.getAll("place").map(String);

    const cities = await listCitiesForCountry(target.id);
    let placesByCity = await Promise.all(
      cities.map(async (c) => ({
        cityName: c.name,
        citySlug: c.slug,
        places: await listPlacesForCity(c.id),
      })),
    );

    // Honour an explicit selection; an empty one means "anywhere in the country".
    if (chosenPlaces.length > 0) {
      const wanted = new Set(chosenPlaces);
      placesByCity = placesByCity
        .map((c) => ({ ...c, places: c.places.filter((p) => wanted.has(p.id)) }))
        .filter((c) => c.places.length > 0);
    }

    // A chosen activity replaces the place's default duration, so picking the
    // hike rather than the viewpoint genuinely reshapes the day.
    const chosenActivityIds = [...formData.entries()]
      .filter(([k]) => k.startsWith("activity-"))
      .map(([, v]) => String(v))
      .filter(Boolean);

    if (chosenActivityIds.length > 0) {
      const chosen = await activitiesByPlaceIds(
        placesByCity.flatMap((c) => c.places.map((p) => p.id)),
      );
      const wanted = new Set(chosenActivityIds);
      placesByCity = placesByCity.map((c) => ({
        ...c,
        places: c.places.map((p) => {
          const act = (chosen.get(p.id) ?? []).find((a) => wanted.has(a.id));
          return act ? { ...p, visitMinutes: act.minutes } : p;
        }),
      }));
    }

    const plan = planTrip({ days, interests, placesByCity });
    const tripSlug = randomUUID().slice(0, 8);
    const session = await auth();

    await saveTrip({
      countryId: target.id,
      slug: tripSlug,
      days,
      interests,
      dietary,
      budget,
      plan,
      startDate,
      userId: session?.user?.id ?? null,
      placeIds: chosenPlaces,
      activityIds: chosenActivityIds,
    });

    redirect(`/trip/${tripSlug}`);
  }

  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-10 sm:px-10">
        <Link
          href={`/country/${country.slug}`}
          className="text-sm text-neutral-600 transition hover:text-clay"
        >
          ← {country.name}
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-clay">Plan your trip</p>
        <h1 className="animate-float-in mt-2 font-display text-4xl text-forest sm:text-5xl">
          {scopeName ? `What will you see in ${scopeName}?` : `Where in ${country.name} are you going?`}
        </h1>
        <p className="mt-3 max-w-xl text-neutral-700">
          Tick the places you actually want. Leave everything unticked and we&apos;ll choose for
          you across {scopeName ?? `the whole of ${country.name}`}.
        </p>

        {scopeName && (
          <Link
            href={`/country/${country.slug}/plan`}
            className="mt-3 inline-block text-sm text-clay hover:underline"
          >
            Plan across all of {country.name} instead →
          </Link>
        )}

        <form action={createTrip} className="mt-10 max-w-4xl">
          <div className="space-y-8">
            {[...byRegion.entries()].map(([key, region]) => (
              <section key={key} className="rounded-md border border-ink/[0.08] bg-cream p-6 shadow-sm">
                <h2 className="font-display text-2xl text-forest">{region.name}</h2>

                <div className="mt-4 space-y-5">
                  {[...region.cities.entries()].map(([cityName, places]) => (
                    <div key={cityName}>
                      <p className="text-xs uppercase tracking-wide text-neutral-600">
                        {cityName}
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {places.map((place) => (
                          <div key={place.id}>
                          <label
                            className="flex cursor-pointer items-start gap-3 rounded-md border border-ink/10 bg-paper px-4 py-3 transition hover:border-clay/50 has-[:checked]:border-clay has-[:checked]:bg-accent-100"
                          >
                            <input
                              type="checkbox"
                              name="place"
                              value={place.id}
                              className="mt-1 h-4 w-4 accent-[#C67139]"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm text-forest">{place.name}</span>
                              {place.summary && (
                                <span className="mt-0.5 block text-xs text-neutral-600">
                                  {place.summary}
                                </span>
                              )}
                            </span>
                          </label>

                          {(activities.get(place.id) ?? []).length > 0 && (
                            <fieldset className="mt-1 space-y-1 pl-7">
                              <legend className="sr-only">How to do {place.name}</legend>
                              {(activities.get(place.id) ?? []).map((act, ai) => (
                                <label
                                  key={act.id}
                                  className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-xs transition hover:bg-surface/70"
                                >
                                  <input
                                    type="radio"
                                    name={`activity-${place.id}`}
                                    value={act.id}
                                    defaultChecked={ai === 0}
                                    className="mt-0.5 h-3 w-3 accent-[#C67139]"
                                  />
                                  <span className="min-w-0">
                                    <span className="text-forest">{act.name}</span>
                                    <span className="ml-2 text-neutral-500">
                                      {(act.minutes / 60).toFixed(1).replace(/\.0$/, "")}h ·{" "}
                                      {act.effort}
                                      {act.cost ? ` · ₹${act.cost.toLocaleString("en-IN")}` : ""}
                                    </span>
                                    {act.summary && (
                                      <span className="mt-0.5 block text-neutral-600">
                                        {act.summary}
                                      </span>
                                    )}
                                  </span>
                                </label>
                              ))}
                            </fieldset>
                          )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-8 rounded-md border border-ink/[0.08] bg-cream p-6 shadow-sm">
            <h2 className="font-display text-2xl text-forest">How do you travel?</h2>

            <div className="mt-5 flex flex-wrap gap-6">
              <div>
                <label htmlFor="days" className="block text-xs text-neutral-600">
                  How many days?
                </label>
                <input
                  id="days"
                  name="days"
                  type="number"
                  min={1}
                  max={30}
                  defaultValue={5}
                  className="mt-1.5 w-28 rounded-md border border-ink/10 bg-paper px-3 py-2 text-ink outline-none focus:border-clay"
                />
              </div>

              <div>
                <label htmlFor="startDate" className="block text-xs text-neutral-600">
                  When are you going?
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="mt-1.5 rounded-md border border-ink/10 bg-paper px-3 py-2 text-ink outline-none focus:border-clay"
                />
              </div>

              <div>
                <label htmlFor="budget" className="block text-xs text-neutral-600">
                  Budget
                </label>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min={0}
                  placeholder="100000"
                  className="mt-1.5 w-40 rounded-md border border-ink/10 bg-paper px-3 py-2 text-ink outline-none placeholder:text-neutral-500 focus:border-clay"
                />
              </div>
            </div>

            <fieldset className="mt-6">
              <legend className="text-xs text-neutral-600">What do you enjoy?</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <label
                    key={i.value}
                    className="cursor-pointer rounded-full border border-ink/12 bg-paper px-4 py-1.5 text-sm text-neutral-700 transition hover:border-clay has-[:checked]:border-clay has-[:checked]:bg-accent-100 has-[:checked]:text-forest"
                  >
                    <input type="checkbox" name={i.value} className="sr-only" />
                    {i.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-6">
              <label htmlFor="dietary" className="block text-xs text-neutral-600">
                Dietary needs
              </label>
              <input
                id="dietary"
                name="dietary"
                placeholder="Vegetarian, halal, gluten-free…"
                className="mt-1.5 w-full max-w-md rounded-md border border-ink/10 bg-paper px-3 py-2 text-ink outline-none placeholder:text-neutral-500 focus:border-clay"
              />
            </div>
          </section>

          <button
            type="submit"
            className="mt-8 rounded-md px-8 py-3 font-display text-cream shadow-md transition hover:opacity-90"
            style={{ backgroundColor: accent.hex }}
          >
            Build my itinerary →
          </button>
        </form>
      </main>
    </div>
  );
}
