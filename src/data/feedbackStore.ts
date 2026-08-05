import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeedbackRecord {
  id: string;
  shopName: string;
  message: string;
  contact: string;
  handled: boolean;
  createdAt: string;
}

export interface FeedbackInput {
  shopName: string;
  message: string;
  contact: string;
}

export const FEEDBACK_QUERY_KEY = ["feedback"] as const;
export const FEEDBACK_COUNT_QUERY_KEY = ["feedback", "unhandled-count"] as const;

/** 주민이 의견·수정요청 제출 (익명 허용, RLS insert 정책). */
export async function submitFeedback(input: FeedbackInput) {
  const { error } = await supabase.from("feedback").insert({
    shop_name: input.shopName.trim(),
    message: input.message.trim(),
    contact: input.contact.trim(),
  });
  if (error) throw error;
}

/** 미처리 접수 개수 (관리자 배지). 주기적으로 갱신해 알림 역할. */
export function useUnhandledFeedbackCount(enabled: boolean) {
  return useQuery({
    queryKey: FEEDBACK_COUNT_QUERY_KEY,
    enabled,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("handled", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** 접수함 목록 (관리자). */
export function useFeedbackList(enabled: boolean) {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEY,
    enabled,
    queryFn: async (): Promise<FeedbackRecord[]> => {
      const { data, error } = await supabase
        .from("feedback")
        .select("id,shop_name,message,contact,handled,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        shopName: r.shop_name ?? "",
        message: r.message ?? "",
        contact: r.contact ?? "",
        handled: r.handled,
        createdAt: r.created_at,
      }));
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY });
  qc.invalidateQueries({ queryKey: FEEDBACK_COUNT_QUERY_KEY });
}

/** 처리 완료/미처리 토글. */
export function useSetFeedbackHandled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, handled }: { id: string; handled: boolean }) => {
      const { error } = await supabase.from("feedback").update({ handled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}

/** 접수 삭제. */
export function useDeleteFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feedback").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}
