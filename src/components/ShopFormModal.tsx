import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { categories, type Category, type Shop } from "@/data/shops";
import type { ShopRecord } from "@/data/shopsStore";

const empty: Shop = {
  name: "",
  category: "식품",
  address: "",
  service: "",
  note: "",
  frequency: "",
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
  onSave,
  onClose,
}: {
  /** 편집 대상. null이면 새 가게 추가 모드 */
  shop: ShopRecord | null;
  onSave: (data: Shop) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Shop>(empty);

  useEffect(() => {
    if (shop) {
      const { id: _id, ...rest } = shop;
      setForm(rest);
    } else {
      setForm(empty);
    }
  }, [shop]);

  // Esc로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isEdit = shop !== null;

  function set<K extends keyof Shop>(key: K, value: Shop[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

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
            <Field label="동네">
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

          <Field label="주소" hint="지도 검색에 이 주소가 그대로 사용됩니다">
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputClass}
              placeholder="예: 서울시 중랑구 면목동 177-2 1층"
            />
          </Field>

          <Field label="나눔 내용">
            <input
              value={form.service}
              onChange={(e) => set("service", e.target.value)}
              className={inputClass}
              placeholder="예: 떡 지원"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="빈도">
              <input
                value={form.frequency}
                onChange={(e) => set("frequency", e.target.value)}
                className={inputClass}
                placeholder="예: 월1회"
              />
            </Field>
            <Field label="비고">
              <input
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                className={inputClass}
                placeholder="선택 입력"
              />
            </Field>
          </div>
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
            disabled={!form.name.trim()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isEdit ? "저장" : "추가"}
          </button>
        </div>
      </motion.form>
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
