/**
 * Seasonal events read better when their colour matches what they are:
 * blossom is pink, autumn foliage is amber, lantern festivals are gold.
 * Complete class strings only — Tailwind cannot see interpolated names.
 */
export type Tone = { text: string; border: string; bg: string };

const TONES: { match: RegExp; tone: Tone }[] = [
  {
    match: /blossom|sakura|hanami|peony|flower|bloom|spring/i,
    tone: {
      text: "text-sakura",
      border: "border-sakura/30",
      bg: "bg-sakura/[0.06]",
    },
  },
  {
    match: /autumn|foliage|colour|color|maple/i,
    tone: {
      text: "text-coral",
      border: "border-coral/30",
      bg: "bg-coral/[0.05]",
    },
  },
  {
    match: /lantern|light|fire|carnival|festival|matsuri|teej/i,
    tone: {
      text: "text-gold",
      border: "border-gold/30",
      bg: "bg-gold/[0.05]",
    },
  },
];

const DEFAULT: Tone = {
  text: "text-mist",
  border: "border-mist/25",
  bg: "bg-mist/[0.04]",
};

export function eventTone(name: string): Tone {
  return TONES.find((t) => t.match.test(name))?.tone ?? DEFAULT;
}
