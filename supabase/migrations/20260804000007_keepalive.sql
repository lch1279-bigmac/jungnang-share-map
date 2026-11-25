-- Supabase 무료 플랜 자동 정지(7일 무활동) 방지용 쓰기 핑
-- 읽기 조회만으로는 활동으로 인정되지 않아 정지된 적이 있어, DB에 실제로 기록하는 함수를 둔다.

create table if not exists public.keepalive (
  id integer primary key default 1 check (id = 1),
  last_ping timestamptz not null default now(),
  ping_count bigint not null default 0
);

-- RLS를 켜고 정책을 만들지 않음 → 테이블을 직접 읽거나 쓰는 것은 모두 차단.
-- 아래 security definer 함수를 통해서만 갱신된다.
alter table public.keepalive enable row level security;

insert into public.keepalive (id) values (1) on conflict (id) do nothing;

create or replace function public.keepalive()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  insert into public.keepalive as k (id, last_ping, ping_count)
  values (1, now(), 1)
  on conflict (id) do update
    set last_ping = now(), ping_count = k.ping_count + 1
  returning k.last_ping;
$$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
