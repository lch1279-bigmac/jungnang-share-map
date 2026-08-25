import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/reset-password")({
  head: () => ({
    meta: [
      { title: "비밀번호 설정 — 우리동네 나눔가게 및 아름다운 이웃 지도" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setReady(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) {
      setError("비밀번호는 8자 이상이어야 해요.");
      return;
    }
    if (pw !== pw2) {
      setError("비밀번호가 서로 달라요.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          링크를 확인하는 중이에요… 안 넘어가면 이메일의 링크를 다시 눌러주세요.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <CheckCircle2 className="size-8 text-primary" />
        <p className="text-sm font-semibold text-foreground">비밀번호가 설정됐어요.</p>
        <a
          href="/admin"
          className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          관리자 로그인으로 이동
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
      >
        <div
          className="mx-auto flex size-14 items-center justify-center rounded-2xl text-primary-foreground"
          style={{ background: "var(--gradient-warm)" }}
        >
          <KeyRound className="size-7" />
        </div>
        <h1 className="mt-4 text-center text-xl font-extrabold text-card-foreground">
          새 비밀번호 설정
        </h1>

        <div className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">새 비밀번호</span>
            <input
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError(null);
              }}
              autoFocus
              autoComplete="new-password"
              className={inputClass}
              placeholder="8자 이상"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">새 비밀번호 확인</span>
            <input
              type="password"
              value={pw2}
              onChange={(e) => {
                setPw2(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              className={inputClass}
              placeholder="다시 입력"
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-center text-xs font-semibold text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !pw || !pw2}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          비밀번호 설정
        </button>
      </motion.form>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/30";
