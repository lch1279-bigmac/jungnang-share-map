import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, AlertTriangle, Trash2, Check, RotateCcw, Store, Phone } from "lucide-react";
import {
  useFeedbackList,
  useSetFeedbackHandled,
  useDeleteFeedback,
} from "@/data/feedbackStore";

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}`;
}

export function FeedbackInbox({ onClose }: { onClose: () => void }) {
  const { data: items = [], isLoading, isError, error, refetch } = useFeedbackList(true);
  const setHandled = useSetFeedbackHandled();
  const del = useDeleteFeedback();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function toggleHandled(id: string, handled: boolean) {
    setBusyId(id);
    try {
      await setHandled.mutateAsync({ id, handled });
    } catch {
      window.alert("처리에 실패했어요. 로그인이 만료됐을 수 있어요.");
    }
    setBusyId(null);
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await del.mutateAsync(id);
    } catch {
      window.alert("삭제에 실패했어요.");
    }
    setBusyId(null);
    setConfirmDeleteId(null);
  }

  const unhandled = items.filter((i) => !i.handled).length;

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
            의견·수정요청 접수함
            {unhandled > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                미처리 {unhandled}
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
              <Loader2 className="size-4 animate-spin" /> 불러오는 중…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertTriangle className="size-6 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "불러오지 못했어요."}
              </p>
              <button
                onClick={() => refetch()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                다시 시도
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              아직 접수된 의견이 없어요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {items.map((f) => (
                <li
                  key={f.id}
                  className={`rounded-2xl border p-3.5 ${
                    f.handled ? "border-border bg-background opacity-70" : "border-primary/40 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {f.shopName && (
                        <p className="flex items-center gap-1 text-xs font-semibold text-primary">
                          <Store className="size-3.5" /> {f.shopName}
                        </p>
                      )}
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-card-foreground">
                        {f.message}
                      </p>
                      {f.contact && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="size-3.5" /> {f.contact}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(f.createdAt)}</p>
                    </div>
                    {!f.handled && (
                      <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                        NEW
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    {confirmDeleteId === f.id ? (
                      <>
                        <span className="mr-auto self-center text-xs font-semibold text-destructive">
                          삭제할까요?
                        </span>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={busyId === f.id}
                          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => remove(f.id)}
                          disabled={busyId === f.id}
                          className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-60"
                        >
                          {busyId === f.id && <Loader2 className="size-3.5 animate-spin" />}
                          삭제 확인
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmDeleteId(f.id)}
                          disabled={busyId === f.id}
                          className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="size-3.5" /> 삭제
                        </button>
                        <button
                          onClick={() => toggleHandled(f.id, !f.handled)}
                          disabled={busyId === f.id}
                          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 ${
                            f.handled
                              ? "border border-border bg-background text-muted-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {busyId === f.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : f.handled ? (
                            <RotateCcw className="size-3.5" />
                          ) : (
                            <Check className="size-3.5" />
                          )}
                          {f.handled ? "미처리로" : "처리완료"}
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
