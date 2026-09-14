/**
 * Passport pages take their character from what the place is, so a rainforest
 * state does not read like an imperial capital. Derived from the kinds of place
 * on the page, with the region name as a tiebreaker for well-known terrain.
 *
 * Complete class strings only — Tailwind cannot see interpolated names.
 */
export type PageStyle = {
  /** Page background wash. */
  surface: string;
  /** Chapter heading colour. */
  heading: string;
  /** Hairline under the chapter heading. */
  rule: string;
  /** Short label printed beside the page number. */
  label: string;
};

const STYLES: Record<string, PageStyle> = {
  forest: {
    surface: "bg-leaf-100",
    heading: "text-leaf-800",
    rule: "bg-gradient-to-r from-leaf-500/60 to-transparent",
    label: "Green pages",
  },
  imperial: {
    surface: "bg-accent-100",
    heading: "text-accent-800",
    rule: "bg-gradient-to-r from-clay/60 to-transparent",
    label: "Stone pages",
  },
  coastal: {
    surface: "bg-surface",
    heading: "text-forest",
    rule: "bg-gradient-to-r from-forest/50 to-transparent",
    label: "Harbour pages",
  },
  table: {
    surface: "bg-accent-100",
    heading: "text-accent-700",
    rule: "bg-gradient-to-r from-accent-500/60 to-transparent",
    label: "Kitchen pages",
  },
  default: {
    surface: "bg-cream",
    heading: "text-forest",
    rule: "bg-gradient-to-r from-ink/25 to-transparent",
    label: "Pages",
  },
};

const WATER = /meghalaya|kerala|venice|zhangjiajie|goa|mumbai|shanghai|assam/i;

/**
 * `kinds` are the place kinds on the page; `regionName` disambiguates terrain
 * that the kinds alone cannot distinguish.
 */
export function pageStyleFor(kinds: string[], regionName: string): PageStyle {
  const count = (k: string) => kinds.filter((x) => x === k).length;

  if (count("nature") > 0 && count("nature") >= count("culture")) return STYLES.forest;
  if (count("food") > count("culture")) return STYLES.table;
  if (WATER.test(regionName)) return STYLES.coastal;
  if (count("culture") > 0 || count("attraction") > 0) return STYLES.imperial;
  return STYLES.default;
}
