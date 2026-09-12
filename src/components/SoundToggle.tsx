"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "destiny:sound";

/**
 * Ambient sound, opt-in and off by default — browsers block autoplay, and
 * unsolicited audio is hostile. Tones are synthesised via WebAudio so the app
 * ships no audio files.
 */
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "on") setOn(true);
    } catch {
      // Private mode or blocked storage: default to off.
    }
  }, []);

  const start = useCallback(() => {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = ctxRef.current ?? new Ctor();
    ctxRef.current = ctx;
    void ctx.resume();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2);
    master.connect(ctx.destination);

    // A slow pentatonic drone: two detuned voices, gently filtered.
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(760, ctx.currentTime);
    filter.connect(master);

    const voices = [146.83, 220, 293.66].map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime(i * 4, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(i === 0 ? 0.5 : 0.22, ctx.currentTime);

      // Slow swell so the drone breathes rather than sitting flat.
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.05 + i * 0.02, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.12, ctx.currentTime);
      lfo.connect(lfoGain).connect(gain.gain);

      osc.connect(gain).connect(filter);
      osc.start();
      lfo.start();
      return { osc, lfo };
    });

    stopRef.current = () => {
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      window.setTimeout(() => {
        voices.forEach(({ osc, lfo }) => {
          osc.stop();
          lfo.stop();
        });
      }, 700);
    };
  }, []);

  useEffect(() => {
    if (on) start();
    else stopRef.current?.();
    return () => stopRef.current?.();
  }, [on, start]);

  function toggle() {
    setOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        // Not persisting is fine; the toggle still works this session.
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
