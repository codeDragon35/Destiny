import type { Photo } from "@/modules/media/wikimedia";

/** Stable hue per name so gradient fallbacks differ between places but never shift between renders. */
function hueFrom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export default function Hero({
  title,
  kicker,
  summary,
  photo,
  seed,
  height = "h-[46vh]",
}: {
  title: string;
  kicker?: React.ReactNode;
  summary?: string | null;
  photo: Photo | null;
  seed: string;
  height?: string;
}) {
  const hue = hueFrom(seed);

  return (
    <header className={`relative ${height} min-h-[300px] max-h-[520px] w-full overflow-hidden`}>
      {photo ? (
        <img
          src={photo.url}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover motion-safe:animate-[kenburns_24s_ease-out_forwards]"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 20% 10%, hsl(${hue} 55% 28%), transparent 60%),
                         radial-gradient(100% 80% at 85% 30%, hsl(${(hue + 45) % 360} 50% 24%), transparent 55%),
                         #101827`,
          }}
        />
      )}

      {/* Keeps text legible over any photo. */}
      <div className="absolute inset-0 bg-gradient-to-t from-space via-space/55 to-space/10" />

      <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-12 sm:px-10 sm:pb-16">
        {kicker}
        <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight text-ivory sm:text-7xl">
          {title}
        </h1>
        {summary && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-mist/80">{summary}</p>
        )}
      </div>

      {photo?.credit && (
        <p className="absolute bottom-3 right-4 text-[11px] text-soft-gray/60">
          Photo: {photo.credit}
        </p>
      )}
    </header>
  );
}
