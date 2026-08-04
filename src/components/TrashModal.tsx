import { useState } from "react";
import { motion } from "framer-motion";
import { X, Trash2, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import {
  useDeletedShopsQuery,
  useRestoreShop,
  usePurgeShop,
} from "@/data/shopsStore";

const catStyles: Record<string, string> = {
  "식품": "bg-food/12 text-food",
  "생활·의류": "bg-living/12 text-living",
  "보건의료": "bg-health/12 text-health",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function TrashModal({ onClose }: { onClose: () => void }) {
  const { data: deleted = [], isLoading, isError, error, refetch } = useDeletedShopsQuery(true);
  const restoreMut = useRestoreShop();
  const purgeMut = usePurgeShop();
  // 영구삭제 확인 대상 id
  const [confirmPurgeId, setConfirmPurgeId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function restore(id: string) {
    setBusyId(id);
    try {
      await restoreMut.mutateAsync(id);
    } catch {
      window.alert("복원에 실패했어요. 로그인이 만료됐을 수 있어요.");
    }
    setBusyId(null);
  }

  async function purge(id: string) {
    setBusyId(id);
    try {
      await purgeMut.mutateAsync(id);
    } catch {
      window.alert("영구삭제에 실패했어요. 로그인이 만료됐을 수 있어요.");
    }
    setBusyId(null);
    setConfirmPurgeId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-card-foreground">
            <Trash2 className="size-5" /> 휴지통
            {deleted.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                {deleted.length}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-[8rem] flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> 휴지통을 불러오는 중…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertTriangle className="size-6 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "휴지통을 불러오지 못했어요."}
              </p>
              <button
                onClick={() => refetch()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                다시 시도
              </button>
            </div>
          ) : deleted.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              휴지통이 비어 있어요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {deleted.map((shop) => (
                <li
                  key={shop.id}
                  className="rounded-2xl border border-border bg-background p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-bold text-card-foreground">
                        <span className="truncate">{shop.name}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            catStyles[shop.category] ?? "bg-muted text-muted-foreground"
                          }`}
                        >
                          {shop.category}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {shop.address || "주소 미등록"} · 삭제일 {fmtDate(shop.deletedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    {confirmPurgeId === shop.id ? (
                      <>
                        <span className="mr-auto self-center text-xs font-semibold text-destructive">
                          영구삭제하면 되돌릴 수 없어요.
                        </span>
                        <button
                          onClick={() => setConfirmPurgeId(null)}
                          disabled={busyId === shop.id}
                          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => purge(shop.id)}
                          disabled={busyId === shop.id}
                          className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                          {busyId === shop.id && <Loader2 className="size-3.5 animate-spin" />}
                          영구삭제 확인
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmPurgeId(shop.id)}
                          disabled={busyId === shop.id}
                          className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="size-3.5" /> 영구삭제
                        </button>
                        <button
                          onClick={() => restore(shop.id)}
                          disabled={busyId === shop.id}
                          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                          {busyId === shop.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="size-3.5" />
                          )}
                          복원
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
