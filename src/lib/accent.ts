/**
 * Per-country accent, keyed by the same motif that drives the emblem and sound.
 * Tailwind cannot see interpolated class names, so every value here is a
 * complete class string.
 */
export type Accent = {
  text: string;
  border: string;
  bg: string;
  rule: string;
  hex: string;
};

const ACCENTS: Record<string, Accent> = {
  dragon: {
    text: "text-clay",
    border: "border-clay/40",
    bg: "bg-clay/10",
    rule: "bg-gradient-to-r from-clay/60 to-transparent",
    hex: "#C67139",
  },
  crane: {
    text: "text-accent-600",
    border: "border-accent-400/50",
    bg: "bg-accent-200/50",
    rule: "bg-gradient-to-r from-accent-400/70 to-transparent",
    hex: "#B2622D",
  },
  peacock: {
    text: "text-leaf-700",
    border: "border-leaf-400/50",
    bg: "bg-leaf-200/50",
    rule: "bg-gradient-to-r from-leaf-500/70 to-transparent",
    hex: "#56633F",
  },
  laurel: {
    text: "text-forest",
    border: "border-forest/40",
    bg: "bg-forest/10",
    rule: "bg-gradient-to-r from-forest/60 to-transparent",
    hex: "#173F35",
  },
};

export function accentFor(motif: string | null | undefined): Accent {
  return ACCENTS[motif ?? ""] ?? ACCENTS.dragon;
}
