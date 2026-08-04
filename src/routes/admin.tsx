import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock } from "lucide-react";
import { ShopExplorer } from "@/components/ShopExplorer";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "관리자 — 중랑구 나눔가게 지도" },
      // 검색엔진에 노출되지 않도록
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

// ⚠️ 클라이언트 사이드 소프트 잠금: 백엔드가 없어 자격증명이 앱 코드에 담깁니다.
// 일반 주민의 접근을 막기엔 충분하지만, 개발자도구를 열 줄 아는 사람은 우회할 수 있습니다.
// 진짜 접근 제어가 필요하면 Supabase Auth 등 서버 인증으로 교체해야 합니다.
const ADMIN_ID = "admin";
const ADMIN_PW = "ers1788**";
const SESSION_KEY = "jnsm.admin.session";

function readSession(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

function AdminPage() {
  const [authed, setAuthed] = useState(false);

  // sessionStorage는 클라이언트에서만 접근 가능 → 마운트 후 반영 (SSR 안전)
  useEffect(() => {
    setAuthed(readSession());
  }, []);

  function handleLogin() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // 저장 실패해도 이번 세션 동안은 로그인 유지
    }
    setAuthed(true);
  }

  function handleLogout() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setAuthed(false);
  }

  if (!authed) {
    return <LoginForm onSuccess={handleLogin} />;
  }

  return <ShopExplorer admin onLogout={handleLogout} />;
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (id === ADMIN_ID && pw === ADMIN_PW) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
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
          <ShieldCheck className="size-7" />
        </div>
        <h1 className="mt-4 text-center text-xl font-extrabold text-card-foreground">
          관리자 로그인
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          중랑구 나눔가게 지도 관리
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">아이디</span>
            <input
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setError(false);
              }}
              autoFocus
              autoComplete="username"
              className={inputClass}
              placeholder="admin"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">비밀번호</span>
            <input
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError(false);
              }}
              autoComplete="current-password"
              className={inputClass}
              placeholder="••••••••"
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-center text-xs font-semibold text-destructive">
            아이디 또는 비밀번호가 올바르지 않습니다.
          </p>
        )}

        <button
          type="submit"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Lock className="size-4" /> 로그인
        </button>
      </motion.form>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/30";
