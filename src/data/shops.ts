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
export const dongOrder = ["면목동", "상봉동", "중화동", "신내동", "망우동", "묵동", "중랑구 외", "주소 미등록"];
export const dongs: string[] = dongOrder.filter((d) => shops.some((s) => s.dong === d));


// 실제 주소를 우선으로 한 검색어 (주소가 없을 때만 가게 이름으로 대체)
function shopQuery(shop: Shop) {
  const addr = shop.address?.trim();
  if (addr && addr !== "-" && addr !== "주소 미등록") return addr;
  return `${shop.name} 서울 중랑구`;
}

export function mapEmbedUrl(shop: Shop) {
  const q = encodeURIComponent(shopQuery(shop));
  return `https://maps.google.com/maps?q=${q}&z=17&hl=ko&output=embed`;
}

export function mapLinkUrl(shop: Shop) {
  // /maps/search/?api=1 형식은 임베드/프리뷰 맥락에서 리다이렉트 중
  // ERR_BLOCKED_BY_RESPONSE로 차단되는 경우가 있어, 바로 핀으로 여는 maps?q= 사용.
  return `https://www.google.com/maps?q=${encodeURIComponent(shopQuery(shop))}`;
}

export function kakaoMapUrl(shop: Shop) {
  return `https://map.kakao.com/?q=${encodeURIComponent(shopQuery(shop))}`;
}

export function naverMapUrl(shop: Shop) {
  return `https://map.naver.com/p/search/${encodeURIComponent(shopQuery(shop))}`;
}
