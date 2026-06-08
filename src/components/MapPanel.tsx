import { motion } from "framer-motion";
import { ExternalLink, MapPin, X } from "lucide-react";
import type { Shop } from "@/data/shops";
import { mapEmbedUrl, mapLinkUrl } from "@/data/shops";

export function MapPanel({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <span className="text-xs font-semibold text-primary">{shop.category}</span>
          <h2 className="text-xl font-extrabold text-card-foreground">{shop.name}</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {shop.address || "주소 미등록"}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted lg:hidden"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
        {shop.service && (
          <div className="rounded-2xl bg-secondary/60 p-3">
            <p className="text-xs font-semibold text-secondary-foreground">나눔 내용</p>
            <p className="mt-0.5 text-sm text-card-foreground">{shop.service}</p>
          </div>
        )}
        {shop.frequency && (
          <div className="rounded-2xl bg-secondary/60 p-3">
            <p className="text-xs font-semibold text-secondary-foreground">빈도</p>
            <p className="mt-0.5 text-sm text-card-foreground">{shop.frequency}</p>
          </div>
        )}
      </div>

      <div className="relative flex-1 min-h-[280px] bg-muted">
        {shop.address ? (
          <iframe
            key={shop.name}
            title={`${shop.name} 위치`}
            src={mapEmbedUrl(shop.address)}
            className="absolute inset-0 size-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            등록된 주소가 없어요
          </div>
        )}
      </div>

      {shop.address && (
        <a
          href={mapLinkUrl(shop.address)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 bg-primary py-3.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          구글지도 앱에서 길찾기 <ExternalLink className="size-4" />
        </a>
      )}
    </motion.div>
  );
}
