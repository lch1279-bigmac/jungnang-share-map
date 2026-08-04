import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  HeartHandshake,
  MapPinned,
  Plus,
  Download,
  RotateCcw,
  Trash2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { categories, dongOrder, type Category, type Shop } from "@/data/shops";
import {
  useShops,
  useIsCustomized,
  updateShop,
  deleteShop,
  addShop,
  resetShops,
  downloadShopsJson,
  type ShopRecord,
} from "@/data/shopsStore";
import { ShopCard } from "@/components/ShopCard";
import { ShopFormModal } from "@/components/ShopFormModal";
import { MapPanel } from "@/components/MapPanel";

/**
 * 나눔가게 탐색 화면.
 * - admin=false (기본, 공개 링크): 검색·필터·지도만. 읽기 전용.
 * - admin=true (/admin 로그인): 수정·삭제·추가·내보내기·초기화 노출.
 */
export function ShopExplorer({
  admin = false,
  onLogout,
}: {
  admin?: boolean;
  onLogout?: () => void;
}) {
  const shops = useShops();
  const customized = useIsCustomized();

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "전체">("전체");
  const [dong, setDong] = useState<string | "전체">("전체");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShopRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ShopRecord | null>(null);

  const selected = useMemo(
    () => shops.find((s) => s.id === selectedId) ?? null,
    [shops, selectedId],
  );

  const dongs = useMemo(
    () => dongOrder.filter((d) => shops.some((s) => s.dong === d)),
    [shops],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shops.filter((s) => {
      if (cat !== "전체" && s.category !== cat) return false;
      if (dong !== "전체" && s.dong !== dong) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.service.toLowerCase().includes(q)
      );
    });
  }, [shops, query, cat, dong]);

  function openAdd() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(shop: ShopRecord) {
    setEditTarget(shop);
    setFormOpen(true);
  }

  function handleSave(data: Shop) {
    if (editTarget) {
      updateShop(editTarget.id, data);
    } else {
      addShop(data);
    }
    setFormOpen(false);
    setEditTarget(null);
  }

  function confirmDelete() {
    if (pendingDelete) deleteShop(pendingDelete.id);
    setPendingDelete(null);
  }

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
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 truncate text-lg font-extrabold leading-tight text-foreground">
              우리동네 나눔가게 지도
              {admin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-xs font-bold text-primary">
                  <ShieldCheck className="size-3" /> 관리자
                </span>
              )}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              따뜻한 마음을 나누는 우리동네 나눔가게 {shops.length}곳
            </p>
          </div>
          {admin && (
            <>
              <button
                onClick={openAdd}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="size-4" /> <span className="hidden sm:inline">가게 추가</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="로그아웃"
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
                >
                  <LogOut className="size-4" /> <span className="hidden sm:inline">로그아웃</span>
                </button>
              )}
            </>
          )}
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

          <div>
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <MapPinned className="size-3.5" /> 동네별로 보기
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip label="전체 동네" active={dong === "전체"} onClick={() => setDong("전체")} />
              {dongs.map((d) => {
                const count = shops.filter((s) => s.dong === d).length;
                return (
                  <FilterChip
                    key={d}
                    label={`${d} ${count}`}
                    active={dong === d}
                    onClick={() => setDong(d)}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{filtered.length}개 가게</p>
            {admin && (
              <div className="flex items-center gap-1.5">
                {customized && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "수정·삭제한 내용을 모두 지우고 원본으로 되돌릴까요? 내보내지 않은 변경은 사라집니다.",
                        )
                      ) {
                        resetShops();
                      }
                    }}
                    className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
                    title="원본으로 되돌리기"
                  >
                    <RotateCcw className="size-3.5" /> 초기화
                  </button>
                )}
                <button
                  onClick={downloadShopsJson}
                  className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                  title="현재 목록을 shops.json 파일로 내려받기"
                >
                  <Download className="size-3.5" /> JSON 내보내기
                </button>
              </div>
            )}
          </div>

          {admin && customized && (
            <p className="-mt-1 rounded-xl bg-secondary/50 px-3 py-2 text-xs text-secondary-foreground">
              변경사항은 이 브라우저에만 저장돼요. 모두에게 반영하려면 <b>JSON 내보내기</b>로
              받은 파일을 <code>src/data/shops.json</code>에 넣고 커밋하세요.
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            {filtered.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                active={selectedId === shop.id}
                onSelect={() => setSelectedId(shop.id)}
                onEdit={admin ? () => openEdit(shop) : undefined}
                onDelete={admin ? () => setPendingDelete(shop) : undefined}
              />
            ))}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                검색 결과가 없어요.
              </p>
            )}
          </div>
        </section>

        {/* Map column (desktop) */}
        <section className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-7.5rem)]">
            {selected ? (
              <MapPanel shop={selected} onClose={() => setSelectedId(null)} />
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
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setSelectedId(null)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 top-12 p-3"
            >
              <MapPanel shop={selected} onClose={() => setSelectedId(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 편집 / 추가 모달 (admin 전용) */}
      <AnimatePresence>
        {admin && formOpen && (
          <ShopFormModal
            shop={editTarget}
            onSave={handleSave}
            onClose={() => {
              setFormOpen(false);
              setEditTarget(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* 삭제 확인 (admin 전용) */}
      <AnimatePresence>
        {admin && pendingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setPendingDelete(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <Trash2 className="size-5" />
              </div>
              <h2 className="mt-3 text-lg font-extrabold text-card-foreground">가게 삭제</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <b className="text-card-foreground">{pendingDelete.name}</b> 을(를) 목록에서
                삭제할까요? 이 브라우저에서만 삭제되며, 초기화하면 되돌릴 수 있어요.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setPendingDelete(null)}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          </div>
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
