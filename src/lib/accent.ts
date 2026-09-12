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
    text: "text-jade",
    border: "border-jade/40",
    bg: "bg-jade/10",
    rule: "bg-gradient-to-r from-jade/60 to-transparent",
    hex: "#2FBF9F",
  },
  crane: {
    text: "text-sakura",
    border: "border-sakura/40",
    bg: "bg-sakura/10",
    rule: "bg-gradient-to-r from-sakura/60 to-transparent",
    hex: "#F2A2C0",
  },
  peacock: {
    text: "text-saffron",
    border: "border-saffron/40",
    bg: "bg-saffron/10",
    rule: "bg-gradient-to-r from-saffron/60 to-transparent",
    hex: "#F0913A",
  },
  laurel: {
    text: "text-terracotta",
    border: "border-terracotta/40",
    bg: "bg-terracotta/10",
    rule: "bg-gradient-to-r from-terracotta/60 to-transparent",
    hex: "#E0654B",
  },
};

export function accentFor(motif: string | null | undefined): Accent {
  return ACCENTS[motif ?? ""] ?? ACCENTS.dragon;
}
