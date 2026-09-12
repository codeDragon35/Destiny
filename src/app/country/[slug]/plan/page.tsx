import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import {
  getCountryBySlug,
  listCitiesForCountry,
  listPlacesForCity,
} from "@/modules/destination/queries";
import { planTrip, type Interest } from "@/modules/trip/planner";
import { saveTrip } from "@/modules/trip/queries";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const INTERESTS: { value: Interest; label: string }[] = [
  { value: "nature", label: "Nature" },
  { value: "culture", label: "Culture" },
  { value: "food", label: "Food" },
  { value: "hidden_gem", label: "Hidden gems" },
];

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) notFound();

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

    const cities = await listCitiesForCountry(target.id);
    const placesByCity = await Promise.all(
      cities.map(async (c) => ({
        cityName: c.name,
        citySlug: c.slug,
        places: await listPlacesForCity(c.id),
      })),
    );

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
      userId: session?.user?.id ?? null,
      startDate,
    });

    redirect(`/trip/${tripSlug}`);
  }

  return (
    <main className="min-h-dvh bg-space">
      <div className="mx-auto max-w-2xl px-6 py-16 sm:px-10 sm:py-24">
        <Link
          href={`/country/${country.slug}`}
          className="text-sm text-soft-gray transition hover:text-jade"
        >
          ← {country.name}
        </Link>

        <p className="mt-10 text-xs uppercase tracking-[0.35em] text-jade">Plan your trip</p>
        <h1 className="mt-4 text-4xl font-semibold text-ivory sm:text-5xl">
          Tell us about your trip
        </h1>
        <p className="mt-4 text-soft-gray">
          We&apos;ll build a day-by-day route through {country.name} around what you care about.
        </p>

        <form action={createTrip} className="mt-12 space-y-10">
          <div>
            <label htmlFor="days" className="block text-sm font-medium text-ivory">
              How many days?
            </label>
            <input
              id="days"
              name="days"
              type="number"
              min={1}
              max={30}
              defaultValue={5}
              className="mt-3 w-32 rounded-lg border border-white/10 bg-midnight px-4 py-3 text-ivory outline-none transition focus:border-jade"
            />
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-ivory">
              When are you going? <span className="text-soft-gray">(optional)</span>
            </label>
            <p className="mt-1 text-xs text-soft-gray/70">
              We&apos;ll flag places that are badly timed and festivals you could catch.
            </p>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className="mt-3 rounded-lg border border-white/10 bg-midnight px-4 py-3 text-ivory outline-none transition focus:border-jade [color-scheme:dark]"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-ivory">What do you enjoy?</legend>
            <div className="mt-3 flex flex-wrap gap-3">
              {INTERESTS.map((i) => (
                <label
                  key={i.value}
                  className="cursor-pointer rounded-full border border-white/10 bg-midnight px-4 py-2 text-sm text-soft-gray transition hover:border-jade/50 has-[:checked]:border-jade has-[:checked]:text-jade"
                >
                  <input type="checkbox" name={i.value} className="sr-only" />
                  {i.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="dietary" className="block text-sm font-medium text-ivory">
              Dietary needs <span className="text-soft-gray">(optional)</span>
            </label>
            <input
              id="dietary"
              name="dietary"
              placeholder="Vegetarian, halal, gluten-free…"
              className="mt-3 w-full rounded-lg border border-white/10 bg-midnight px-4 py-3 text-ivory placeholder:text-soft-gray/50 outline-none transition focus:border-jade"
            />
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-ivory">
              Budget <span className="text-soft-gray">(optional)</span>
            </label>
            <input
              id="budget"
              name="budget"
              type="number"
              min={0}
              placeholder="100000"
              className="mt-3 w-48 rounded-lg border border-white/10 bg-midnight px-4 py-3 text-ivory placeholder:text-soft-gray/50 outline-none transition focus:border-jade"
            />
          </div>

          <button
            type="submit"
            className="rounded-full bg-jade px-8 py-3 font-medium text-space transition hover:bg-jade/90"
          >
            Build my itinerary
          </button>
        </form>
      </div>
    </main>
  );
}
