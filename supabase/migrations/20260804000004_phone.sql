-- 가게 전화번호 (있는 경우만 전화걸기 버튼 노출)
alter table public.shops add column if not exists phone text not null default '';
