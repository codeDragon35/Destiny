import type { Collectible } from "@/modules/souvenir/queries";

const KIND = {
  stamp: { label: "Stamp", icon: "◉" },
  passport: { label: "Passport", icon: "❖" },
  souvenir: { label: "Souvenir", icon: "✦" },
  book: { label: "Book", icon: "▤" },
  badge: { label: "Badge", icon: "✷" },
} as const;

export function kindOf(kind: string) {
  return KIND[kind as keyof typeof KIND] ?? KIND.souvenir;
}

export default function CollectibleBadge({ item }: { item: Collectible }) {
  const k = kindOf(item.kind);
  return (
    <div className="flex h-full flex-col rounded-xl border border-clay/20 bg-clay/[0.04] p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-clay">
        <span aria-hidden>{k.icon}</span>
        {k.label}
      </div>
      <h4 className="mt-2 text-forest">{item.name}</h4>
      {item.description && (
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.description}</p>
      )}
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-xs text-neutral-600">
        {item.whereToGet && <span>{item.whereToGet}</span>}
        <span className={item.cost ? "text-clay/80" : "text-clay"}>
          {item.cost ? `¥${item.cost}` : "Free"}
        </span>
      </div>
    </div>
  );
}
