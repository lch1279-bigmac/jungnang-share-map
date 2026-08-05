import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";
import { submitFeedback } from "@/data/feedbackStore";

/**
 * 주민용 의견·수정요청 접수 폼.
 * defaultShopName: 특정 가게를 보고 있을 때 미리 채워줌.
 */
export function FeedbackModal({
  defaultShopName = "",
  onClose,
}: {
  defaultShopName?: string;
  onClose: () => void;
}) {
  const [shopName, setShopName] = useState(defaultShopName);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(false);
    try {
      await submitFeedback({ shopName, message, contact });
      setDone(true);
    } catch {
      setError(true);
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-extrabold text-card-foreground">의견·수정요청</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <CheckCircle2 className="size-12 text-health" />
            <p className="text-base font-bold text-card-foreground">접수되었습니다. 감사합니다!</p>
            <p className="text-sm text-muted-foreground">
              보내주신 의견은 관리자가 확인 후 반영합니다.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              닫기
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4 px-5 py-4">
            <p className="text-sm text-muted-foreground">
              가게 정보 수정, 새 가게 제보, 오류 신고 등 무엇이든 남겨주세요.
            </p>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                가게 이름 <span className="font-normal">(선택)</span>
              </span>
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className={inputClass}
                placeholder="어느 가게에 대한 의견인가요?"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                내용 <span className="text-destructive">*</span>
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                autoFocus
                className={`${inputClass} resize-y`}
                placeholder="예: OO가게 전화번호가 바뀌었어요 / 새로 생긴 나눔가게를 알려요"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                연락처 <span className="font-normal">(선택 · 회신이 필요하면)</span>
              </span>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className={inputClass}
                placeholder="전화번호 또는 이메일"
              />
            </label>

            {error && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-xs font-semibold text-destructive">
                전송에 실패했어요. 잠시 후 다시 시도해 주세요.
              </p>
            )}

            <button
              type="submit"
              disabled={!message.trim() || submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              보내기
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/30";
