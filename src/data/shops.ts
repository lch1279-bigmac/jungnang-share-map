// 가게 데이터는 이제 Supabase `shops` 테이블에서 읽어온다 (src/data/shopsStore.ts).
// shops.json은 최초 seed 소스로만 남아있다 (supabase/migrations).

export type Category = "식품" | "생활·의류" | "보건의료";

export interface Shop {
  name: string;
  category: Category;
  address: string;
  /** 소개글 (기존 나눔내용·빈도를 대체) */
  intro: string;
  note: string;
  dong: string;
}

export const categories: { key: Category; label: string; emoji: string }[] = [
  { key: "식품", label: "식품", emoji: "🍚" },
  { key: "생활·의류", label: "생활·의류", emoji: "🧥" },
  { key: "보건의료", label: "보건의료", emoji: "💊" },
];

// 동 정렬 순서 (면목동 우선 / 미등록·구외는 뒤로). 실제 동 목록은 데이터에서 계산.
export const dongOrder = ["면목동", "상봉동", "중화동", "신내동", "망우동", "묵동", "중랑구 외", "주소 미등록"];

// 지도 검색어: 항상 주소로 검색한다 (주소가 없으면 상호명으로 폴백).
function shopQuery(shop: Shop) {
  const addr = shop.address?.trim();
  if (addr && addr !== "-" && addr !== "주소 미등록") return addr;
  return shop.name;
}


export function mapEmbedUrl(shop: Shop, ambiguous = false) {
  const q = encodeURIComponent(shopQuery(shop, ambiguous));
  return `https://maps.google.com/maps?q=${q}&z=17&hl=ko&output=embed`;
}

export function mapLinkUrl(shop: Shop, ambiguous = false) {
  // /maps/search/?api=1 형식은 임베드/프리뷰 맥락에서 리다이렉트 중
  // ERR_BLOCKED_BY_RESPONSE로 차단되는 경우가 있어, 바로 핀으로 여는 maps?q= 사용.
  return `https://www.google.com/maps?q=${encodeURIComponent(shopQuery(shop, ambiguous))}`;
}

export function kakaoMapUrl(shop: Shop, ambiguous = false) {
  return `https://map.kakao.com/?q=${encodeURIComponent(shopQuery(shop, ambiguous))}`;
}

export function naverMapUrl(shop: Shop, ambiguous = false) {
  return `https://map.naver.com/p/search/${encodeURIComponent(shopQuery(shop, ambiguous))}`;
}
