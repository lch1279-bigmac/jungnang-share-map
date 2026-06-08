import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, HeartHandshake } from "lucide-react";
import { shops, categories, type Category, type Shop } from "@/data/shops";
import { ShopCard } from "@/components/ShopCard";
import { MapPanel } from "@/components/MapPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "중랑구 나눔가게 지도 — 우리동네 나눔가게" },
      {
        name: "description",
        content:
          "서울 중랑구의 나눔가게를 식품·생활·의류·보건의료로 살펴보고, 가게를 누르면 구글지도로 위치를 확인할 수 있는 모바일 친화 지도 앱.",
      },
      { property: "og:title", content: "중랑구 나눔가게 지도" },
      {
        property: "og:description",
        content: "중랑구 나눔가게 100여 곳을 카테고리별로 살펴보고 지도로 위치를 확인하세요.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "전체">("전체");
  const [selected, setSelected] = useState<Shop | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shops.filter((s) => {
      if (cat !== "전체" && s.category !== cat) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.service.toLowerCase().includes(q)
      );
    });
  }, [query, cat]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-primary-foreground"
            style={{ background: "var(--gradient-warm)" }}
          >
            <HeartHandshake className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold leading-tight text-foreground">
              중랑구 나눔가게 지도
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              따뜻한 마음을 나누는 우리동네 {shops.length}곳
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* List column */}
        <section className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="가게 이름·주소·나눔 내용 검색"
              className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip label={`전체 ${shops.length}`} active={cat === "전체"} onClick={() => setCat("전체")} />
            {categories.map((c) => {
              const count = shops.filter((s) => s.category === c.key).length;
              return (
                <FilterChip
                  key={c.key}
                  label={`${c.emoji} ${c.label} ${count}`}
                  active={cat === c.key}
                  onClick={() => setCat(c.key)}
                />
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">{filtered.length}개 가게</p>

          <motion.div layout className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {filtered.map((shop) => (
                <ShopCard
                  key={shop.name + shop.address}
                  shop={shop}
                  active={selected?.name === shop.name}
                  onSelect={() => setSelected(shop)}
                />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                검색 결과가 없어요.
              </p>
            )}
          </motion.div>
        </section>

        {/* Map column (desktop) */}
        <section className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-7.5rem)]">
            {selected ? (
              <MapPanel shop={selected} onClose={() => setSelected(null)} />
            ) : (
              <EmptyMap />
            )}
          </div>
        </section>
      </main>

      {/* Map sheet (mobile) */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 top-12 p-3"
            >
              <MapPanel shop={selected} onClose={() => setSelected(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground border border-border hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyMap() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 text-center">
      <div
        className="flex size-14 items-center justify-center rounded-2xl text-primary-foreground"
        style={{ background: "var(--gradient-warm)" }}
      >
        <HeartHandshake className="size-7" />
      </div>
      <p className="font-semibold text-foreground">가게를 선택해 보세요</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        목록에서 나눔가게를 누르면 구글지도로 위치를 바로 확인할 수 있어요.
      </p>
    </div>
  );
}
