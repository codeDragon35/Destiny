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
    <div className="flex h-full flex-col rounded-xl border border-gold/20 bg-gold/[0.04] p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
        <span aria-hidden>{k.icon}</span>
        {k.label}
      </div>
      <h4 className="mt-2 text-ivory">{item.name}</h4>
      {item.description && (
        <p className="mt-2 text-sm leading-relaxed text-soft-gray">{item.description}</p>
      )}
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-xs text-soft-gray">
        {item.whereToGet && <span>{item.whereToGet}</span>}
        <span className={item.cost ? "text-gold/80" : "text-jade"}>
          {item.cost ? `¥${item.cost}` : "Free"}
        </span>
      </div>
    </div>
  );
}
