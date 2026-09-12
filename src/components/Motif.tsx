/**
 * Country-specific decoration. Each motif is a self-contained SVG so adding a
 * country means adding a case here, not touching the pages that render it.
 */

function Dragon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 140"
      className={className}
      fill="none"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="dragon-scale" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#F4C95D" stopOpacity="0.15" />
          <stop offset="45%" stopColor="#F4C95D" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#F47C6C" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {/* Serpentine body */}
      <path
        className="dragon-body"
        d="M14 96c46-4 62-44 104-48 44-4 52 38 96 36 40-2 48-40 90-42 36-2 54 26 86 24 22-1 38-12 52-24"
        stroke="url(#dragon-scale)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Spine ridge */}
      <path
        className="dragon-body dragon-spine"
        d="M14 96c46-4 62-44 104-48 44-4 52 38 96 36 40-2 48-40 90-42 36-2 54 26 86 24 22-1 38-12 52-24"
        stroke="#F7F4EA"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 13"
        opacity="0.55"
      />
      {/* Head */}
      <g className="dragon-head">
        <circle cx="442" cy="42" r="11" fill="#F4C95D" opacity="0.95" />
        <circle cx="446" cy="39" r="2" fill="#101827" />
        <path d="M436 34l-9-8 12 2z" fill="#F47C6C" opacity="0.9" />
        <path d="M450 48c8 3 14 1 18-3" stroke="#F47C6C" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {/* Whiskers */}
      <path
        className="dragon-whisker"
        d="M434 46c-14 8-26 6-36 0"
        stroke="#F4C95D"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}


function Crane({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 140" className={className} fill="none" aria-hidden preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="crane-wing" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#F7F4EA" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#F47C6C" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* Flight path */}
      <path className="dragon-body" d="M20 104c60-10 96-52 150-56 48-4 74 30 122 24 36-4 60-26 92-40"
        stroke="#F4C95D" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 10" opacity="0.5" />
      <g className="dragon-head">
        {/* Body and neck */}
        <path d="M300 74c18-6 34-4 46 6-14 8-30 10-46 4z" fill="url(#crane-wing)" />
        <path d="M346 80c14-2 24-10 30-20" stroke="#F7F4EA" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <circle cx="378" cy="58" r="5" fill="#F7F4EA" />
        <circle cx="380" cy="56" r="1.5" fill="#101827" />
        <path d="M383 58l12-3-11 7z" fill="#F4C95D" />
        {/* Wings */}
        <path d="M306 72c-12-20-6-38 12-46 6 18 4 34-12 46z" fill="url(#crane-wing)" opacity="0.9" />
        <path d="M314 84c-16 10-34 8-44-6 16-8 32-8 44 6z" fill="url(#crane-wing)" opacity="0.7" />
        {/* Trailing legs */}
        <path d="M300 82l-30 16M304 84l-26 20" stroke="#F7F4EA" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}

function Peacock({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 140" className={className} fill="none" aria-hidden preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="peacock-fan" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#2FBF9F" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#F4C95D" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F47C6C" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Fanned tail feathers radiating from the body */}
      <g className="dragon-body" stroke="url(#peacock-fan)" strokeWidth="2" strokeLinecap="round">
        {[-52, -38, -24, -10, 4, 18, 32, 46].map((angle) => (
          <path
            key={angle}
            d={`M240 96 q ${Math.sin((angle * Math.PI) / 180) * 90} ${-60 - Math.abs(angle) * 0.2} ${
              Math.sin((angle * Math.PI) / 180) * 150
            } ${-72 - Math.abs(angle) * 0.1}`}
          />
        ))}
      </g>
      {/* Feather eyes */}
      <g className="dragon-head">
        {[-52, -24, 4, 32].map((angle) => (
          <circle
            key={angle}
            cx={240 + Math.sin((angle * Math.PI) / 180) * 150}
            cy={96 - 72 - Math.abs(angle) * 0.1}
            r="5"
            fill="#2FBF9F"
            opacity="0.85"
          />
        ))}
        <circle cx="240" cy="98" r="9" fill="#2FBF9F" opacity="0.9" />
        <path d="M246 92l14-8-10 13z" fill="#F4C95D" />
      </g>
    </svg>
  );
}

function Laurel({ className = "" }: { className?: string }) {
  const leaf = (x: number, flip: number) =>
    `M${x} 92 q ${8 * flip} -14 ${22 * flip} -10 q ${-8 * flip} 14 ${-22 * flip} 10 z`;
  return (
    <svg viewBox="0 0 480 140" className={className} fill="none" aria-hidden preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="laurel-leaf" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#2FBF9F" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#F4C95D" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* Two branches curving toward each other, as on a Roman wreath */}
      <path className="dragon-body" d="M60 96 q 110 -46 180 -46" stroke="url(#laurel-leaf)" strokeWidth="3" strokeLinecap="round" />
      <path className="dragon-body" d="M420 96 q -110 -46 -180 -46" stroke="url(#laurel-leaf)" strokeWidth="3" strokeLinecap="round" />
      <g className="dragon-head" fill="url(#laurel-leaf)" opacity="0.85">
        {[90, 122, 154, 186].map((x) => (
          <path key={`l${x}`} d={leaf(x, 1)} transform={`rotate(-18 ${x} 92)`} />
        ))}
        {[294, 326, 358, 390].map((x) => (
          <path key={`r${x}`} d={leaf(x, -1)} transform={`rotate(18 ${x} 92)`} />
        ))}
        <circle cx="240" cy="48" r="5" fill="#F4C95D" opacity="0.9" />
      </g>
    </svg>
  );
}

export default function Motif({
  motif,
  className = "",
}: {
  motif: string | null;
  className?: string;
}) {
  if (motif === "dragon") return <Dragon className={className} />;
  if (motif === "crane") return <Crane className={className} />;
  if (motif === "peacock") return <Peacock className={className} />;
  if (motif === "laurel") return <Laurel className={className} />;
  return null;
}
