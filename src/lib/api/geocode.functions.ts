import { createServerFn } from "@tanstack/react-start";
import process from "node:process";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// 도로명/지번 주소 → "시도 시군구 법정동" 문자열로 변환 (카카오 로컬 API).
// 도로명 주소는 글자만으론 법정동을 알 수 없어(한 도로가 여러 동을 지남) 좌표 기반 조회가 필요.
// REST 키는 서버에만 두고(process.env.KAKAO_REST_API_KEY), 로그인 관리자만 호출 가능.
// 키가 없으면 region:null 을 돌려주고, 클라이언트는 기존 동작(수동 입력)으로 폴백한다.
export const resolveRegion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ address: z.string().min(1) }))
  .handler(async ({ data }): Promise<{ region: string | null }> => {
    const key = process.env.KAKAO_REST_API_KEY;
    if (!key) return { region: null };
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
          data.address,
        )}&size=1`,
        { headers: { Authorization: `KakaoAK ${key}` } },
      );
      if (!res.ok) return { region: null };
      const json = (await res.json()) as {
        documents?: Array<{
          address?: {
            region_1depth_name?: string;
            region_2depth_name?: string;
            region_3depth_name?: string;
          };
          road_address?: {
            region_1depth_name?: string;
            region_2depth_name?: string;
            region_3depth_name?: string;
          };
        }>;
      };
      const doc = json.documents?.[0];
      // 지번(address)의 region_3depth_name 이 법정동. 없으면 도로명 쪽 사용.
      const src = doc?.address ?? doc?.road_address;
      if (!src) return { region: null };
      const region = [
        src.region_1depth_name,
        src.region_2depth_name,
        src.region_3depth_name,
      ]
        .filter(Boolean)
        .join(" ");
      return { region: region || null };
    } catch {
      return { region: null };
    }
  });
