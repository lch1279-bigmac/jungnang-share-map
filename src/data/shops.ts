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

/** 상호명 비교용 정규화: 공백·기호 제거, 소문자화, 지점 표기 제거 */
export function normalizeShopName(name: string) {
  return name
    .toLowerCase()
    .replace(/[\s()[\]{}.,·・'"“”‘’\-_/]/g, "")
    .replace(/(본점|직영점|지점|점)$/u, "");
}

/** 같거나 비슷한 상호를 가진 가게 이름 집합 (지도 검색 시 주소 사용) */
export function findAmbiguousNames(shops: { name: string }[]) {
  const groups = new Map<string, string[]>();
  for (const s of shops) {
    const key = normalizeShopName(s.name);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), s.name]);
  }
  const keys = [...groups.keys()];
  const ambiguous = new Set<string>();
  for (let i = 0; i < keys.length; i++) {
    const a = keys[i];
    // 완전히 같은(정규화 후) 상호가 둘 이상
    if ((groups.get(a) ?? []).length > 1) groups.get(a)!.forEach((n) => ambiguous.add(n));
    for (let j = i + 1; j < keys.length; j++) {
      const b = keys[j];
      // 비슷한 상호: 한쪽이 다른 쪽으로 시작하고 길이가 2자 이상
      const similar =
        a.length >= 2 && b.length >= 2 && (a.startsWith(b) || b.startsWith(a));
      if (similar) {
        groups.get(a)!.forEach((n) => ambiguous.add(n));
        groups.get(b)!.forEach((n) => ambiguous.add(n));
      }
    }
  }
  return ambiguous;
}

// 지도 검색어: 기본은 상호명만. 같거나 비슷한 상호가 있을 때(ambiguous)는
// 주소로 검색한다(주소가 없으면 상호명으로 폴백).
function shopQuery(shop: Shop, ambiguous = false) {
  if (ambiguous) {
    const addr = shop.address?.trim();
    if (addr && addr !== "-" && addr !== "주소 미등록") return addr;
  }
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
