-- 관리자 허용 목록 + 의견함 입력 제한
-- 이전: "로그인한 사용자 = 관리자" (to authenticated using (true))
-- 이후: admins 테이블에 등록된 사용자만 쓰기/휴지통/의견함 접근 가능

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- 본인이 관리자인지 확인할 수 있도록 자기 행만 읽기 허용 (쓰기 정책 없음 → 대시보드/service role에서만 추가)
drop policy if exists "admins_self_read" on public.admins;
create policy "admins_self_read"
  on public.admins for select to authenticated
  using (user_id = auth.uid());

-- 현재 로그인 사용자가 관리자인지 (RLS 재귀 방지를 위해 security definer)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 기존 계정은 모두 관리자로 등록 (지금 쓰는 관리자가 잠기지 않도록).
-- 실행 후 아래 쿼리로 목록을 확인하고, 모르는 계정은 삭제하세요:
--   select a.user_id, u.email from public.admins a join auth.users u on u.id = a.user_id;
insert into public.admins (user_id)
select id from auth.users
on conflict do nothing;

-- shops: 쓰기·전체 열람(휴지통)을 관리자로 제한
drop policy if exists "shops_auth_insert" on public.shops;
create policy "shops_auth_insert"
  on public.shops for insert to authenticated
  with check (public.is_admin());

drop policy if exists "shops_auth_update" on public.shops;
create policy "shops_auth_update"
  on public.shops for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "shops_auth_delete" on public.shops;
create policy "shops_auth_delete"
  on public.shops for delete to authenticated
  using (public.is_admin());

drop policy if exists "shops_auth_read_all" on public.shops;
create policy "shops_auth_read_all"
  on public.shops for select to authenticated
  using (public.is_admin());

-- feedback: 열람/수정/삭제를 관리자로 제한
drop policy if exists "feedback_admin_select" on public.feedback;
create policy "feedback_admin_select"
  on public.feedback for select to authenticated
  using (public.is_admin());

drop policy if exists "feedback_admin_update" on public.feedback;
create policy "feedback_admin_update"
  on public.feedback for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "feedback_admin_delete" on public.feedback;
create policy "feedback_admin_delete"
  on public.feedback for delete to authenticated
  using (public.is_admin());

-- feedback: 익명 제출 입력 제한 (스팸/용량 방어). 기존 행은 검사하지 않음(not valid).
alter table public.feedback drop constraint if exists feedback_message_len;
alter table public.feedback
  add constraint feedback_message_len check (char_length(message) between 1 and 2000) not valid;

alter table public.feedback drop constraint if exists feedback_shop_name_len;
alter table public.feedback
  add constraint feedback_shop_name_len check (char_length(shop_name) <= 100) not valid;

alter table public.feedback drop constraint if exists feedback_contact_len;
alter table public.feedback
  add constraint feedback_contact_len check (char_length(contact) <= 100) not valid;

-- 익명이 '처리완료' 상태로 넣지 못하게
drop policy if exists "feedback_insert_anyone" on public.feedback;
create policy "feedback_insert_anyone"
  on public.feedback for insert
  with check (handled = false);
