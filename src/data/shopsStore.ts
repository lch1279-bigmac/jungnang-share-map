import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Shop } from "./shops";

// DB에서 온 가게 레코드 (id, 최종수정시각 포함)
export interface ShopRecord extends Shop {
  id: string;
  updatedAt: string;
}

const SELECT_COLS = "id,name,category,address,intro,note,dong,sort_order,updated_at";
export const SHOPS_QUERY_KEY = ["shops"] as const;

async function fetchShops(): Promise<ShopRecord[]> {
  const { data, error } = await supabase
    .from("shops")
    .select(SELECT_COLS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category as Category,
    address: r.address ?? "",
    intro: r.intro ?? "",
    note: r.note ?? "",
    dong: r.dong ?? "",
    updatedAt: r.updated_at,
  }));
}

/** 가게 목록 조회 (공개·관리자 공통). RLS로 읽기는 누구나 허용. */
export function useShopsQuery() {
  return useQuery({
    queryKey: SHOPS_QUERY_KEY,
    queryFn: fetchShops,
    staleTime: 30_000,
  });
}

/** 가게 추가 (목록 맨 뒤에 배치). RLS로 로그인 사용자만 성공. */
export function useAddShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shop: Shop) => {
      const { data: maxRow } = await supabase
        .from("shops")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const sort_order = (maxRow?.sort_order ?? -1) + 1;
      const { error } = await supabase.from("shops").insert({ ...shop, sort_order });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SHOPS_QUERY_KEY }),
  });
}

/** 가게 수정. */
export function useUpdateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Shop }) => {
      const { error } = await supabase.from("shops").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SHOPS_QUERY_KEY }),
  });
}

/** 가게 삭제. */
export function useDeleteShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SHOPS_QUERY_KEY }),
  });
}
