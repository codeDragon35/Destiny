/** Slow drifting star field for page backgrounds. Positions are fixed so SSR matches. */
const STARS = [
  { x: 6, y: 12, s: 2, d: 0 }, { x: 18, y: 34, s: 1.5, d: 900 },
  { x: 31, y: 8, s: 2.5, d: 1800 }, { x: 44, y: 52, s: 1.5, d: 600 },
  { x: 57, y: 21, s: 2, d: 2400 }, { x: 69, y: 44, s: 1.5, d: 1200 },
  { x: 78, y: 14, s: 2.5, d: 300 }, { x: 88, y: 38, s: 2, d: 2100 },
  { x: 12, y: 66, s: 2, d: 1500 }, { x: 27, y: 82, s: 1.5, d: 2700 },
  { x: 41, y: 71, s: 2.5, d: 450 }, { x: 63, y: 88, s: 1.5, d: 1950 },
  { x: 74, y: 63, s: 2, d: 750 }, { x: 92, y: 79, s: 1.5, d: 2250 },
];

export default function StarField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {STARS.map((star, i) => (
        <span
          key={i}
          className="sparkle absolute rounded-full bg-gold"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.s,
            height: star.s,
            animationDelay: `${star.d}ms`,
            animationDuration: "5s",
          }}
        />
      ))}
    </div>
  );
}
