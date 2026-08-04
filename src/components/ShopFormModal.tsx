import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Search, Loader2 } from "lucide-react";
import { categories, deriveDong, type Category, type Shop } from "@/data/shops";
import type { ShopRecord } from "@/data/shopsStore";
import { loadDaumPostcode } from "@/lib/daumPostcode";
import { resolveRegion } from "@/lib/api/geocode.functions";

const empty: Shop = {
  name: "",
  category: "식품",
  address: "",
  intro: "",
  note: "",
  dong: "",
};

// dong 후보 (자유 입력도 허용하되 자주 쓰는 값은 목록으로 제공)
const dongOptions = [
  "면목동",
  "상봉동",
  "중화동",
  "신내동",
  "망우동",
  "묵동",
  "중랑구 외",
  "주소 미등록",
];

export function ShopFormModal({
  shop,
  busy = false,
  onSave,
  onClose,
}: {
  /** 편집 대상. null이면 새 가게 추가 모드 */
  shop: ShopRecord | null;
  /** 저장(DB 반영) 진행 중 여부 */
  busy?: boolean;
  onSave: (data: Shop) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Shop>(empty);

  // ── 주소 검색 상태 (다음 우편번호 서비스) ──
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const [postcodeError, setPostcodeError] = useState(false);
  const postcodeRef = useRef<HTMLDivElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shop) {
      const { id: _id, updatedAt: _updatedAt, ...rest } = shop;
      setForm(rest);
    } else {
      setForm(empty);
    }
  }, [shop]);

  // Esc: 주소 검색이 열려 있으면 그것부터 닫고, 아니면 모달 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (postcodeOpen) setPostcodeOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, postcodeOpen]);

  const isEdit = shop !== null;

  function set<K extends keyof Shop>(key: K, value: Shop[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // 주소를 바꾸면 동네(dong)를 자동 추론해 함께 갱신 → 해당 동네 탭으로 이동.
  // 1) dongHint(주소검색의 법정동)나 지번 주소면 글자에서 즉시 추론.
  // 2) 도로명이라 글자로 판단 불가하면(deriveDong=null) 카카오 지오코딩으로 법정동 조회(디바운스).
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    },
    [],
  );

  function setAddress(address: string, dongHint?: string) {
    const local = deriveDong(dongHint || address);
    setForm((f) => ({ ...f, address, ...(local ? { dong: local } : {}) }));

    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    // 힌트가 없고 글자만으론 중랑구 법정동을 못 찾은 경우(도로명) → 좌표 기반 조회
    if (!dongHint && local === null) {
      geocodeTimer.current = setTimeout(async () => {
        try {
          const { region } = await resolveRegion({ data: { address } });
          const derived = region ? deriveDong(region) : null;
          if (derived) {
            // 조회 중 주소가 또 바뀌지 않았을 때만 반영
            setForm((f) => (f.address === address ? { ...f, dong: derived } : f));
          }
        } catch {
          // 실패 시 동네는 수동 입력으로 폴백
        }
      }, 600);
    }
  }

  // ── 주소 검색 (다음 우편번호 서비스) ──
  function openPostcode() {
    setPostcodeError(false);
    setPostcodeLoading(true);
    setPostcodeOpen(true);
  }

  useEffect(() => {
    if (!postcodeOpen) return;
    let cancelled = false;
    loadDaumPostcode()
      .then(() => {
        if (cancelled || !postcodeRef.current || !window.daum) return;
        postcodeRef.current.innerHTML = "";
        setPostcodeLoading(false);
        new window.daum.Postcode({
          oncomplete: (data) => {
            const base =
              data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
            // 도로명 주소라도 시군구+법정동으로 동네를 정확히 판단
            const dongHint = `${data.sido ?? ""} ${data.sigungu ?? ""} ${data.bname ?? ""}`;
            setAddress(base, dongHint);
            setPostcodeOpen(false);
            // 상세주소(층/호 등)를 이어서 입력할 수 있도록 포커스
            requestAnimationFrame(() => addressInputRef.current?.focus());
          },
          onclose: () => setPostcodeOpen(false),
          width: "100%",
          height: "100%",
        }).embed(postcodeRef.current);
      })
      .catch(() => {
        if (cancelled) return;
        setPostcodeLoading(false);
        setPostcodeError(true);
        setPostcodeOpen(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcodeOpen]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-extrabold text-card-foreground">
            {isEdit ? "가게 정보 수정" : "가게 추가"}
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

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <Field label="가게 이름" required>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
              className={inputClass}
              placeholder="예: 비단방앗간"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="분류">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value as Category)}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="동네" hint="주소로 자동 설정 (필요시 수정)">
              <input
                list="dong-options"
                value={form.dong}
                onChange={(e) => set("dong", e.target.value)}
                className={inputClass}
                placeholder="예: 면목동"
              />
              <datalist id="dong-options">
                {dongOptions.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </Field>
          </div>

          <Field label="주소" hint="주소를 바꾸면 동네가 자동으로 맞춰져요">
            <div className="flex gap-2">
              <input
                ref={addressInputRef}
                value={form.address}
                onChange={(e) => setAddress(e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="주소 검색을 눌러 도로명·지번 주소를 선택하세요"
              />
              <button
                type="button"
                onClick={openPostcode}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                <Search className="size-4" /> 주소 검색
              </button>
            </div>
            {postcodeError && (
              <span className="text-xs font-semibold text-destructive">
                주소 검색을 불러오지 못했어요. 네트워크 확인 후 다시 시도하거나 직접 입력하세요.
              </span>
            )}
          </Field>

          <Field label="소개" hint="가게를 소개하는 글 (목록·지도에 표시)">
            <textarea
              value={form.intro}
              onChange={(e) => set("intro", e.target.value)}
              rows={4}
              className={`${inputClass} resize-y`}
              placeholder="예: 따뜻한 한 끼를 나누는 나눔가게예요. 매달 정성껏 떡을 나눠 주세요."
            />
          </Field>

          <Field label="비고" hint="관리용 메모 (공개되지 않음)">
            <input
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              className={inputClass}
              placeholder="선택 입력"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!form.name.trim() || busy}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "저장" : "추가"}
          </button>
        </div>
      </motion.form>

      {/* 주소 검색 오버레이 (다음 우편번호 embed) */}
      {postcodeOpen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setPostcodeOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 flex h-[32rem] max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-extrabold text-card-foreground">주소 검색</h3>
              <button
                type="button"
                onClick={() => setPostcodeOpen(false)}
                aria-label="주소 검색 닫기"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="relative flex-1">
              {postcodeLoading && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> 주소 검색을 불러오는 중…
                </div>
              )}
              <div ref={postcodeRef} className="size-full" />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
        {hint && <span className="ml-1 font-normal text-muted-foreground/70">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}
