import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Shop } from "./shops";

// DB에서 온 가게 레코드 (id, 최종수정시각 포함)
export interface ShopRecord extends Shop {
  id: string;
  updatedAt: string;
}

// 휴지통 항목 (삭제 시각 포함)
export interface DeletedShopRecord extends ShopRecord {
  deletedAt: string;
}

const SELECT_COLS =
  "id,name,category,address,address_detail,intro,phone,note,dong,sort_order,updated_at";
export const SHOPS_QUERY_KEY = ["shops"] as const;
export const DELETED_SHOPS_QUERY_KEY = ["shops", "deleted"] as const;

function mapRow(r: {
  id: string;
  name: string;
  category: string;
  address: string | null;
  address_detail: string | null;
  intro: string | null;
  phone: string | null;
  note: string | null;
  dong: string | null;
  updated_at: string;
}): ShopRecord {
  return {
    id: r.id,
    name: r.name,
    category: r.category as Category,
    address: r.address ?? "",
    addressDetail: r.address_detail ?? "",
    intro: r.intro ?? "",
    phone: r.phone ?? "",
    note: r.note ?? "",
    dong: r.dong ?? "",
    updatedAt: r.updated_at,
  };
}

// Shop(camelCase) → DB row(snake_case) 변환. addressDetail만 컬럼명이 다름.
function toDbFields(shop: Shop) {
  const { addressDetail, ...rest } = shop;
  return { ...rest, address_detail: addressDetail };
}

async function fetchShops(): Promise<ShopRecord[]> {
  const { data, error } = await supabase
    .from("shops")
    .select(SELECT_COLS)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

async function fetchDeletedShops(): Promise<DeletedShopRecord[]> {
  const { data, error } = await supabase
    .from("shops")
    .select(`${SELECT_COLS},deleted_at`)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...mapRow(r), deletedAt: r.deleted_at as string }));
}

/** 가게 목록 조회 (공개·관리자 공통). 삭제된 항목은 제외. */
export function useShopsQuery() {
  return useQuery({
    queryKey: SHOPS_QUERY_KEY,
    queryFn: fetchShops,
    staleTime: 30_000,
  });
}

/** 휴지통(삭제된 가게) 조회. RLS로 로그인 사용자만 열람 가능. */
export function useDeletedShopsQuery(enabled: boolean) {
  return useQuery({
    queryKey: DELETED_SHOPS_QUERY_KEY,
    queryFn: fetchDeletedShops,
    enabled,
    staleTime: 10_000,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: SHOPS_QUERY_KEY });
  qc.invalidateQueries({ queryKey: DELETED_SHOPS_QUERY_KEY });
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
      const { error } = await supabase
        .from("shops")
        .insert({ ...toDbFields(shop), sort_order });
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

/** 가게 수정. */
export function useUpdateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Shop }) => {
      const { error } = await supabase.from("shops").update(toDbFields(patch)).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

/** 가게 삭제 → 휴지통으로 이동 (소프트 삭제). */
export function useDeleteShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shops")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

/** 휴지통에서 복원. */
export function useRestoreShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shops")
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

/** 휴지통에서 영구 삭제 (되돌릴 수 없음). */
export function usePurgeShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(qc),
  });
}
