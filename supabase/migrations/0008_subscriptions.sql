-- CaseBoard: 사무실 단위 구독 트래킹 (수동 + 향후 자동 결제 공통 사용)
--
-- MVP 단계 흐름:
--   1) 사무실 생성 → 자동 'pending' 행 생성
--   2) 사용자가 /billing 에서 안내된 계좌로 입금
--   3) 사장님이 입금 확인 후 SQL Editor 에서 'active' 로 수동 업데이트
--   4) 매월 같은 방식으로 갱신
--
-- 추후 토스페이먼츠 연동되면 webhook 이 같은 테이블 업데이트.

create table public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  office_id             uuid not null unique references public.offices(id) on delete cascade,
  status                text not null default 'pending'
                          check (status in ('pending', 'active', 'overdue', 'cancelled')),
  plan_amount_krw       integer not null default 150000,   -- 월 정액 (KRW)
  vat_included          boolean not null default false,    -- false = 부가세 별도
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  last_paid_at          timestamptz,
  cancelled_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index subscriptions_status_idx on public.subscriptions(status);

alter table public.subscriptions enable row level security;

-- 사무실 admin 만 자기 사무실 구독을 볼 수 있다.
create policy "subscriptions_select_admin"
  on public.subscriptions for select
  using (
    office_id = public.current_user_office()
    and public.current_user_role() = 'admin'
  );
-- INSERT/UPDATE 정책 없음 → 앱에서 못 씀. service role (SQL Editor / 향후 webhook) 만 쓴다.

create or replace function public.set_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_subscriptions_updated_at();

-- 사무실 생성 시 자동으로 구독 행 생성
create or replace function public.create_subscription_for_office()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (office_id) values (new.id);
  return new;
end;
$$;

create trigger offices_auto_subscription
  after insert on public.offices
  for each row execute function public.create_subscription_for_office();

-- 백필: 이미 존재하는 사무실은 모두 'active' (이 시스템 전에 만들어진 것들)
insert into public.subscriptions (office_id, status, current_period_start, current_period_end, last_paid_at)
select id, 'active', now(), now() + interval '30 days', now()
from public.offices
where id not in (select office_id from public.subscriptions);
