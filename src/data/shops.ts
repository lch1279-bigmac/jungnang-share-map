import raw from "./shops.json";

export type Category = "식품" | "생활·의류" | "보건의료";

export interface Shop {
  name: string;
  category: Category;
  address: string;
  service: string;
  note: string;
  frequency: string;
  dong: string;
}

export const shops: Shop[] = (raw as Shop[]).filter((s) => s.name && s.name !== "-");

export const categories: { key: Category; label: string; emoji: string }[] = [
  { key: "식품", label: "식품", emoji: "🍚" },
  { key: "생활·의류", label: "생활·의류", emoji: "🧥" },
  { key: "보건의료", label: "보건의료", emoji: "💊" },
];

// 동 목록 (가게 수 많은 순, 면목동 우선 / 미등록·구외는 뒤로)
const dongOrder = ["면목동", "상봉동", "중화동", "신내동", "망우동", "묵동", "중랑구 외", "주소 미등록"];
export const dongs: string[] = dongOrder.filter((d) => shops.some((s) => s.dong === d));


export function mapEmbedUrl(address: string) {
  const q = encodeURIComponent(address.includes("중랑") || address.includes("서울") ? address : `서울 중랑구 ${address}`);
  return `https://maps.google.com/maps?q=${q}&z=16&hl=ko&output=embed`;
}

export function mapLinkUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
