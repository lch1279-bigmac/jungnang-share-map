import { useSyncExternalStore } from "react";
import raw from "./shops.json";
import type { Shop } from "./shops";

// 각 가게에 안정적인 id를 부여한 레코드. id는 수정해도 바뀌지 않으므로
// 편집/삭제 대상을 안전하게 지목할 수 있다.
export interface ShopRecord extends Shop {
  id: string;
}

const STORAGE_KEY = "jnsm.shops.v1";

function withIds(list: Shop[]): ShopRecord[] {
  return list.map((s, i) => ({
    ...s,
    id: (s as Partial<ShopRecord>).id ?? `s${i}`,
  }));
}

// shops.json 원본 (필터: 이름 없는 빈 행 제거)
const base: ShopRecord[] = withIds(
  (raw as Shop[]).filter((s) => s.name && s.name !== "-"),
);

function load(): ShopRecord[] {
  if (typeof localStorage === "undefined") return base;
  try {
    const str = localStorage.getItem(STORAGE_KEY);
    if (!str) return base;
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed) && parsed.every((s) => s && typeof s.id === "string")) {
      return parsed as ShopRecord[];
    }
  } catch {
    // 손상된 저장값은 무시하고 원본 사용
  }
  return base;
}

let current: ShopRecord[] = load();
let customized =
  typeof localStorage !== "undefined" && !!localStorage.getItem(STORAGE_KEY);

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    customized = true;
  } catch {
    // 저장 실패해도 화면 상태는 갱신
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// ── React hooks ──────────────────────────────────────────────
export function useShops(): ShopRecord[] {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => base,
  );
}

export function useIsCustomized(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => customized,
    () => false,
  );
}

// ── mutations ────────────────────────────────────────────────
export function updateShop(id: string, patch: Partial<Shop>) {
  current = current.map((s) => (s.id === id ? { ...s, ...patch } : s));
  persist();
}

export function deleteShop(id: string) {
  current = current.filter((s) => s.id !== id);
  persist();
}

export function addShop(shop: Shop) {
  current = [{ ...shop, id: `s${Date.now()}` }, ...current];
  persist();
}

export function resetShops() {
  current = base;
  customized = false;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emit();
}

// ── export ───────────────────────────────────────────────────
// shops.json과 동일한 필드/순서로 직렬화 (id 제외). git에 커밋해 영구 반영.
export function exportShopsJson(): string {
  const clean = current.map((s) => ({
    name: s.name,
    category: s.category,
    address: s.address,
    service: s.service,
    note: s.note,
    frequency: s.frequency,
    dong: s.dong,
  }));
  return JSON.stringify(clean, null, 2);
}

export function downloadShopsJson() {
  if (typeof document === "undefined") return;
  const blob = new Blob([exportShopsJson()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "shops.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
