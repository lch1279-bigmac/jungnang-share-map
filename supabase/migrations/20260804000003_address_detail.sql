-- 상세주소(층/호/동 등)를 기본주소와 분리 저장하는 컬럼
alter table public.shops add column if not exists address_detail text not null default '';
