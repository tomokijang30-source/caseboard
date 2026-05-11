-- ----------------------------------------------------------------------------
-- offices.is_demo: 어드민 패널에서 데모 데이터와 실고객을 시각적으로 분리하기 위한 플래그.
-- seed 스크립트가 데모 사무실에 대해 true로 설정.
-- ----------------------------------------------------------------------------
alter table public.offices
  add column if not exists is_demo boolean not null default false;

create index if not exists offices_is_demo_idx
  on public.offices (is_demo);
