/** Decorative sparkle burst; positions are fixed so server and client render alike. */
const POINTS = [
  { x: "8%", y: "22%", size: 10, delay: 0 },
  { x: "88%", y: "16%", size: 13, delay: 600 },
  { x: "72%", y: "78%", size: 9, delay: 1200 },
  { x: "18%", y: "72%", size: 11, delay: 1800 },
  { x: "50%", y: "8%", size: 8, delay: 2400 },
];

export default function Sparkles({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      {POINTS.map((p, i) => (
        <svg
          key={i}
          className="sparkle absolute"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}ms`,
          }}
          viewBox="0 0 24 24"
          fill="#C67139"
        >
          <path d="M12 0l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" />
        </svg>
      ))}
    </div>
  );
}
