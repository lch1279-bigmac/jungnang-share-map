import { motion } from "framer-motion";
import { ExternalLink, MapPin, Phone, X } from "lucide-react";
import type { Shop } from "@/data/shops";
import { fullAddress, telHref, mapEmbedUrl, mapLinkUrl, kakaoMapUrl, naverMapUrl } from "@/data/shops";

export function MapPanel({
  shop,
  onClose,
}: {
  shop: Shop;
  onClose: () => void;
}) {
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
            {fullAddress(shop) || "주소 미등록"}
          </p>
          {telHref(shop.phone) && (
            <a
              href={telHref(shop.phone)!}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Phone className="size-4" /> 전화 걸기
              <span className="font-normal opacity-90">{shop.phone}</span>
            </a>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted lg:hidden"
        >
          <X className="size-5" />
        </button>
      </div>

      {shop.intro && (
        <div className="px-5 py-4">
          <div className="rounded-2xl bg-secondary/60 p-3.5">
            <p className="text-xs font-semibold text-secondary-foreground">소개</p>
            <p className="mt-1 text-sm leading-relaxed text-card-foreground">{shop.intro}</p>
          </div>
        </div>
      )}

      <div className="relative flex-1 min-h-[280px] bg-muted">
        <iframe
          key={shop.name}
          title={`${shop.name} 위치`}
          src={mapEmbedUrl(shop)}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="grid grid-cols-3 border-t border-border">
        <a
          href={mapLinkUrl(shop)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          구글지도 <ExternalLink className="size-3.5" />
        </a>
        <a
          href={kakaoMapUrl(shop)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 border-l border-border bg-[#FEE500] py-3.5 text-sm font-semibold text-[#3C1E1E] transition-opacity hover:opacity-90"
        >
          카카오지도 <ExternalLink className="size-3.5" />
        </a>
        <a
          href={naverMapUrl(shop)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 border-l border-border bg-[#03C75A] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          네이버지도 <ExternalLink className="size-3.5" />
        </a>
      </div>
    </motion.div>
  );
}
