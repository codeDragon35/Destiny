import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCityBySlug,
  getCountryBySlug,
  listPlacesForCity,
} from "@/modules/destination/queries";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  attraction: "Attraction",
  nature: "Nature",
  culture: "Culture",
  food: "Food",
  hidden_gem: "Hidden gem",
};

const KIND_STYLES: Record<string, string> = {
  attraction: "bg-jade/15 text-jade",
  nature: "bg-mist/15 text-mist",
  culture: "bg-gold/15 text-gold",
  food: "bg-coral/15 text-coral",
  hidden_gem: "bg-gold/15 text-gold",
};

function formatVisit(minutes: number | null) {
  if (!minutes) return null;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h visit` : `${hours.toFixed(1)}h visit`;
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string; city: string }>;
}) {
  const { slug, city: citySlug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) notFound();

  const city = await getCityBySlug(country.id, citySlug);
  if (!city) notFound();

  const places = await listPlacesForCity(city.id);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href={`/country/${country.slug}`}
        className="text-sm text-soft-gray transition hover:text-jade"
      >
        ← {country.name}
      </Link>

      <h1 className="mt-6 text-4xl font-semibold text-ivory">{city.name}</h1>
      {city.summary && <p className="mt-4 max-w-2xl text-soft-gray">{city.summary}</p>}

      <h2 className="mt-14 text-sm uppercase tracking-[0.2em] text-jade">Places</h2>
      <ul className="mt-6 space-y-4">
        {places.map((place) => {
          const visit = formatVisit(place.visitMinutes);
          return (
            <li
              key={place.id}
              className="rounded-xl border border-white/5 bg-midnight p-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-medium text-ivory">{place.name}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${KIND_STYLES[place.kind] ?? "bg-white/10 text-soft-gray"}`}
                >
                  {KIND_LABELS[place.kind] ?? place.kind}
                </span>
                {visit && <span className="text-xs text-soft-gray">{visit}</span>}
              </div>
              {place.summary && (
                <p className="mt-3 text-sm leading-relaxed text-soft-gray">{place.summary}</p>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
