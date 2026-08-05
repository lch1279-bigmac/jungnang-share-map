-- 주민 의견·수정요청 접수함
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null default '',
  message text not null,
  contact text not null default '',
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists feedback_inbox_idx on public.feedback (handled, created_at desc);

alter table public.feedback enable row level security;

-- 누구나 접수(제출) 가능 (익명 포함)
drop policy if exists "feedback_insert_anyone" on public.feedback;
create policy "feedback_insert_anyone"
  on public.feedback for insert
  with check (true);

-- 관리자(로그인 사용자)만 열람/수정/삭제 (연락처 등 개인정보 보호)
drop policy if exists "feedback_admin_select" on public.feedback;
create policy "feedback_admin_select"
  on public.feedback for select to authenticated
  using (true);

drop policy if exists "feedback_admin_update" on public.feedback;
create policy "feedback_admin_update"
  on public.feedback for update to authenticated
  using (true) with check (true);

drop policy if exists "feedback_admin_delete" on public.feedback;
create policy "feedback_admin_delete"
  on public.feedback for delete to authenticated
  using (true);
