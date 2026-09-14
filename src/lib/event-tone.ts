/**
 * Seasonal events read better when their colour matches what they are:
 * blossom is pink-clay, autumn foliage is amber, festivals are gold.
 * Complete class strings only — Tailwind cannot see interpolated names.
 */
export type Tone = { text: string; border: string; bg: string };

const TONES: { match: RegExp; tone: Tone }[] = [
  {
    match: /blossom|sakura|hanami|peony|flower|bloom|spring/i,
    tone: {
      text: "text-accent-600",
      border: "border-accent-300",
      bg: "bg-accent-100",
    },
  },
  {
    match: /autumn|foliage|colour|color|maple/i,
    tone: {
      text: "text-clay",
      border: "border-clay/30",
      bg: "bg-clay/[0.07]",
    },
  },
  {
    match: /lantern|light|fire|carnival|festival|matsuri|teej/i,
    tone: {
      text: "text-leaf-700",
      border: "border-leaf-300",
      bg: "bg-leaf-100",
    },
  },
];

const DEFAULT: Tone = {
  text: "text-forest",
  border: "border-ink/10",
  bg: "bg-surface",
};

export function eventTone(name: string): Tone {
  return TONES.find((t) => t.match.test(name))?.tone ?? DEFAULT;
}
