import type { Shop } from "@/data/shops";
import { MapPin, Pencil, Trash2 } from "lucide-react";

const catStyles: Record<string, string> = {
  "식품": "bg-food/12 text-food",
  "생활·의류": "bg-living/12 text-living",
  "보건의료": "bg-health/12 text-health",
};

export function ShopCard({
  shop,
  active,
  onSelect,
  onEdit,
  onDelete,
}: {
  shop: Shop;
  active: boolean;
  onSelect: () => void;
  /** admin 모드에서만 전달. 없으면 수정 버튼 숨김 */
  onEdit?: () => void;
  /** admin 모드에서만 전달. 없으면 삭제 버튼 숨김 */
  onDelete?: () => void;
}) {
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div
      className={`group relative rounded-2xl border bg-card transition-colors ${
        active
          ? "border-primary ring-2 ring-primary/30 shadow-[var(--shadow-soft)]"
          : "border-border hover:border-primary/40 shadow-[var(--shadow-card)]"
      }`}
    >
      <button
        onClick={onSelect}
        className="w-full text-left rounded-2xl p-4 transition-transform active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-2">
          {/* 수정/삭제 버튼이 있을 때만 오른쪽 여백 확보 */}
          <h3 className={`font-bold text-card-foreground leading-snug ${hasActions ? "pr-16" : ""}`}>
            {shop.name}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              catStyles[shop.category] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {shop.category}
          </span>
        </div>
        {shop.intro && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
            {shop.intro}
          </p>
        )}
        <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span className="line-clamp-1">{shop.address || "주소 미등록"}</span>
        </p>
      </button>

      {/* 수정 / 삭제 액션 (admin 전용, 카드 우상단 카테고리 배지 아래) */}
      {hasActions && (
        <div className="absolute right-3 top-11 flex gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              aria-label={`${shop.name} 수정`}
              title="수정"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              aria-label={`${shop.name} 삭제`}
              title="삭제"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
