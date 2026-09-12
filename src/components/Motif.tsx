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

export default function Motif({
  motif,
  className = "",
}: {
  motif: string | null;
  className?: string;
}) {
  if (motif === "dragon") return <Dragon className={className} />;
  return null;
}
