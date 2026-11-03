import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ShopExplorer } from "@/components/ShopExplorer";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "관리자 — 우리동네 나눔가게 및 아름다운 이웃 지도" },
      // 검색엔진에 노출되지 않도록
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> 확인 중…
      </div>
    );
  }

  if (!session) {
    return <LoginForm />;
  }

  return <AdminGate userId={session.user.id} email={session.user.email} onLogout={handleLogout} />;
}

// 로그인했더라도 admins 허용 목록에 있는 사용자만 관리자 화면을 보여준다 (실제 권한은 DB RLS가 강제).
function AdminGate({
  userId,
  email,
  onLogout,
}: {
  userId: string;
  email?: string;
  onLogout: () => void;
}) {
  const [state, setState] = useState<"checking" | "yes" | "no" | "error">("checking");

  useEffect(() => {
    let cancelled = false;
    setState("checking");
    supabase.rpc("is_admin").then(({ data, error }) => {
      if (cancelled) return;
      if (error) setState("error");
      else setState(data ? "yes" : "no");
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> 권한 확인 중…
      </div>
    );
  }

  if (state === "yes") {
    return <ShopExplorer admin onLogout={onLogout} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <ShieldCheck className="size-8 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">
        {state === "no"
          ? "관리자 권한이 없는 계정이에요."
          : "권한을 확인하지 못했어요. 잠시 후 다시 시도해 주세요."}
      </p>
      {email && <p className="text-xs text-muted-foreground">{email}</p>}
      <button
        type="button"
        onClick={onLogout}
        className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        로그아웃
      </button>
    </div>
  );
}

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 가입이 막혀 있어 Supabase가 구글 로그인을 거부하면 /admin?error=... 로 돌아온다.
  // 등록되지 않은 계정이므로 권한 없음 안내를 보여준다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const failed = params.get("error") || hash.get("error");
    if (!failed) return;
    // 거부된 계정도 access_denied 등으로 돌아와 취소와 구분하기 어려우므로 같은 안내를 쓴다.
    setError("관리자 권한이 없는 계정이에요. 등록된 관리자 계정으로 로그인해 주세요.");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function signInWithGoogle() {
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin` },
    });
    // 성공하면 구글 로그인 페이지로 이동하므로 이후 코드는 실패했을 때만 의미가 있다.
    if (error) {
      setSubmitting(false);
      setError("구글 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
      >
        <div
          className="mx-auto flex size-14 items-center justify-center rounded-2xl text-primary-foreground"
          style={{ background: "var(--gradient-warm)" }}
        >
          <ShieldCheck className="size-7" />
        </div>
        <h1 className="mt-4 text-center text-xl font-extrabold text-card-foreground">
          관리자 로그인
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          우리동네 나눔가게 및 아름다운 이웃 지도 관리
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <svg viewBox="0 0 48 48" className="size-4" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.1 5.5c4.3-4 6.7-9.9 6.7-16.9z" />
              <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.9 2.3-8.8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
          )}
          Google로 로그인
        </button>

        {error && (
          <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-center text-xs font-semibold text-destructive">
            {error}
          </p>
        )}
      </motion.div>
    </div>
  );
}
