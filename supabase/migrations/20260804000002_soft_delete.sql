-- 휴지통(소프트 삭제): deleted_at 설정 시 목록에서 숨김, 복원/영구삭제 가능
alter table public.shops add column if not exists deleted_at timestamptz;
create index if not exists shops_deleted_at_idx on public.shops (deleted_at);

-- 공개 읽기: 삭제되지 않은 가게만 노출 (주민에게는 휴지통 항목 안 보임)
drop policy if exists "shops_public_read" on public.shops;
create policy "shops_public_read"
  on public.shops for select
  using (deleted_at is null);

-- 관리자(로그인 사용자): 삭제된 항목 포함 전체 열람 (휴지통용)
drop policy if exists "shops_auth_read_all" on public.shops;
create policy "shops_auth_read_all"
  on public.shops for select to authenticated
  using (true);
