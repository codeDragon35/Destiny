"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "destiny:sound";

/** Scale degrees (semitones from the root) that give each country its character. */
const SCALES: Record<string, { root: number; steps: number[] }> = {
  // Chinese pentatonic (gong): bright, open fifths.
  dragon: { root: 196.0, steps: [0, 2, 4, 7, 9] },
  // Japanese hirajoshi: minor second gives it the distinctive koto colour.
  crane: { root: 220.0, steps: [0, 2, 3, 7, 8] },
  // Indian raga-like: flat second and flat sixth.
  peacock: { root: 174.61, steps: [0, 1, 4, 7, 8] },
  // Lydian-ish colour for Italy: bright, with a raised fourth.
  laurel: { root: 261.63, steps: [0, 2, 4, 6, 7, 11] },
  // Western major pentatonic.
  default: { root: 196.0, steps: [0, 2, 4, 7, 9] },
};

function semitone(root: number, steps: number) {
  return root * Math.pow(2, steps / 12);
}

/**
 * Plucked-string ambience: sparse notes from a country-specific scale, each a
 * short decaying tone. Opt-in and off by default — browsers block autoplay and
 * unrequested sound is hostile.
 */
export default function SoundToggle({ motif }: { motif?: string | null }) {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "on") setOn(true);
    } catch {
      // Blocked storage: stay off.
    }
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    void ctxRef.current?.suspend();
  }, []);

  const start = useCallback(() => {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = ctxRef.current ?? new Ctor();
    ctxRef.current = ctx;
    void ctx.resume();

    const scale = SCALES[motif ?? "default"] ?? SCALES.default;

    const pluck = (freq: number, at: number, gainValue: number) => {
      // Two partials give the note a little body without sounding synthetic.
      [1, 2.01].forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq * ratio, at);

        const gain = ctx.createGain();
        const peak = gainValue * (i === 0 ? 1 : 0.3);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.6);

        osc.connect(gain).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 2.8);
      });
    };

    const schedule = () => {
      const now = ctx.currentTime;
      const octave = Math.random() < 0.25 ? 2 : 1;
      const step = scale.steps[Math.floor(Math.random() * scale.steps.length)];
      pluck(semitone(scale.root, step) * octave, now + 0.05, 0.09);

      // Occasional harmony a fifth below, so it does not feel mechanical.
      if (Math.random() < 0.35) {
        pluck(semitone(scale.root, step) / 1.5, now + 0.22, 0.05);
      }

      timerRef.current = window.setTimeout(schedule, 1700 + Math.random() * 2200);
    };

    schedule();
  }, [motif]);

  useEffect(() => {
    if (on) start();
    else stop();
    return stop;
  }, [on, start, stop]);

  function toggle() {
    setOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        // Not persisting is fine.
      }
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={on ? "Mute ambience" : "Play ambience"}
      className="rounded-full border border-white/10 px-3 py-1.5 text-soft-gray transition hover:border-jade/50 hover:text-jade"
    >
      <span aria-hidden>{on ? "♪" : "♪̸"}</span>
      <span className="sr-only">{on ? "Mute ambience" : "Play ambience"}</span>
    </button>
  );
}
