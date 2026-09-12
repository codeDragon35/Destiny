import Link from "next/link";
import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import { getCountryBySlug, listCitiesForCountry } from "@/modules/destination/queries";
import { searchPhoto } from "@/modules/media/unsplash";

export const dynamic = "force-dynamic";

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) notFound();

  const cities = await listCitiesForCountry(country.id);
  const [hero, ...cityPhotos] = await Promise.all([
    searchPhoto(`${country.name} landscape travel`),
    ...cities.map((c) => searchPhoto(`${c.name} ${country.name} city`)),
  ]);

  const totalPlaces = cities.reduce((n, c) => n + c.placeCount, 0);

  return (
    <main className="min-h-dvh bg-space">
      <Hero
        title={country.name}
        summary={country.summary}
        photo={hero}
        seed={country.slug}
        kicker={
          <div className="animate-float-in">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-mist/70 transition hover:text-jade"
            >
              <span aria-hidden>←</span> All countries
            </Link>
            <div className="mt-6 flex items-center gap-3 text-sm text-mist/70">
              <span className="text-4xl leading-none">{country.emoji}</span>
              <span className="h-px w-8 bg-jade/50" />
              <span>
                {cities.length} {cities.length === 1 ? "city" : "cities"} · {totalPlaces} places
              </span>
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <h2 className="text-xs uppercase tracking-[0.35em] text-jade">Where to go</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-6">
          {cities.map((city, i) => {
            const photo = cityPhotos[i];
            // First card runs wide; the rest pair up, so the grid never reads as a uniform table.
            const wide = i === 0;
            return (
              <Reveal
                key={city.id}
                delay={i * 90}
                className={wide ? "md:col-span-6" : "md:col-span-3"}
              >
                <Link
                  href={`/country/${country.slug}/${city.slug}`}
                  className="group relative block h-full overflow-hidden rounded-2xl border border-white/5 bg-midnight transition duration-500 hover:-translate-y-1 hover:border-jade/40 hover:shadow-2xl hover:shadow-jade/5"
                >
                  <div className={`relative overflow-hidden ${wide ? "h-72" : "h-56"}`}>
                    {photo ? (
                      <img
                        src={photo.url}
                        alt=""
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-midnight via-space to-midnight" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
                    <span className="absolute right-4 top-4 rounded-full bg-space/70 px-3 py-1 text-xs font-medium text-gold backdrop-blur">
                      {city.placeCount} places
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-medium text-ivory transition group-hover:text-jade">
                      {city.name}
                    </h3>
                    {city.summary && (
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-soft-gray">
                        {city.summary}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-2 text-sm text-jade opacity-0 transition duration-300 group-hover:opacity-100">
                      Explore {city.name}
                      <span className="transition group-hover:translate-x-1" aria-hidden>
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </main>
  );
}
