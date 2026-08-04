// 가게 데이터는 이제 Supabase `shops` 테이블에서 읽어온다 (src/data/shopsStore.ts).
// shops.json은 최초 seed 소스로만 남아있다 (supabase/migrations).

export type Category = "식품" | "생활·의류" | "보건의료";

export interface Shop {
  name: string;
  category: Category;
  address: string;
  /** 상세주소 (층/호 등). 지도 검색·동네 판정에는 쓰지 않음 */
  addressDetail: string;
  /** 소개글 (기존 나눔내용·빈도를 대체) */
  intro: string;
  /** 전화번호 (있으면 전화걸기 버튼 노출) */
  phone: string;
  note: string;
  dong: string;
}

/** tel: 링크용으로 전화번호에서 숫자·+ 만 남긴다. 없으면 null */
export function telHref(phone: string): string | null {
  const cleaned = (phone || "").replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : null;
}

/** 기본주소 + 상세주소를 합친 표시용 전체 주소 */
export function fullAddress(shop: Pick<Shop, "address" | "addressDetail">): string {
  return [shop.address, shop.addressDetail].filter((v) => v && v.trim()).join(" ");
}

export const categories: { key: Category; label: string; emoji: string }[] = [
  { key: "식품", label: "식품", emoji: "🍚" },
  { key: "생활·의류", label: "생활·의류", emoji: "🧥" },
  { key: "보건의료", label: "보건의료", emoji: "💊" },
];

// 동 정렬 순서 (면목동 우선 / 미등록·구외는 뒤로). 실제 동 목록은 데이터에서 계산.
export const dongOrder = ["면목동", "상봉동", "중화동", "신내동", "망우동", "묵동", "중랑구 외", "주소 미등록"];

// 중랑구 법정동 6곳. 행정동(면목2동, 중화1동…)·본동도 base 법정동으로 묶는다.
const DONG_BASES: [string, string][] = [
  ["면목", "면목동"],
  ["상봉", "상봉동"],
  ["중화", "중화동"],
  ["신내", "신내동"],
  ["망우", "망우동"],
  ["묵", "묵동"],
];

/**
 * 주소(또는 "시군구 법정동" 문자열)에서 동네 탭 값을 추론.
 * - 빈 주소 → "주소 미등록"
 * - 중랑구 법정동을 찾으면 그 base 동 (예: 면목2동·면목본동 → "면목동")
 * - 중랑구인데 법정동을 못 찾으면(도로명만 있음) → null (판단 보류)
 * - 그 외 지역 → "중랑구 외"
 */
export function deriveDong(address: string): string | null {
  const a = (address || "").trim();
  if (!a) return "주소 미등록";
  for (const [key, val] of DONG_BASES) {
    if (new RegExp(`${key}[0-9·,.본]*동`).test(a)) return val;
  }
  if (a.includes("중랑구")) return null;
  return "중랑구 외";
}

// 지도 검색어: 항상 주소로 검색한다 (주소가 없으면 상호명으로 폴백).
function shopQuery(shop: Shop) {
  const addr = shop.address?.trim();
  if (addr && addr !== "-" && addr !== "주소 미등록") return addr;
  return shop.name;
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
