import type { Shop } from "@/data/shops";
import { MapPin } from "lucide-react";

const catStyles: Record<string, string> = {
  "식품": "bg-food/12 text-food",
  "생활·의류": "bg-living/12 text-living",
  "보건의료": "bg-health/12 text-health",
};

export function ShopCard({
  shop,
  active,
  onSelect,
}: {
  shop: Shop;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border bg-card p-4 transition-colors active:scale-[0.99] ${
        active
          ? "border-primary ring-2 ring-primary/30 shadow-[var(--shadow-soft)]"
          : "border-border hover:border-primary/40 shadow-[var(--shadow-card)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-card-foreground leading-snug">{shop.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            catStyles[shop.category] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {shop.category}
        </span>
      </div>
      {shop.service && (
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-1">
          나눔: {shop.service}
        </p>
      )}
      <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 size-3.5 shrink-0" />
        <span className="line-clamp-1">{shop.address || "주소 미등록"}</span>
      </p>
    </motion.button>
  );
}
