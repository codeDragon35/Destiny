"use client";

import { useEffect, useRef, useState } from "react";

/** Fades and lifts children into view on scroll. Progressive enhancement only. */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Visible by default so content still renders if JS never runs.
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Only animate what starts below the fold; anything already visible would flicker.
    if (el.getBoundingClientRect().top < window.innerHeight - 40) return;
    setHidden(true);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          io.disconnect();
        }
      },
      { rootMargin: "-40px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
        hidden ? "opacity-0 motion-safe:translate-y-6" : "opacity-100 translate-y-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
