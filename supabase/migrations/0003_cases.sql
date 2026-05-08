-- CaseBoard: cases table + RLS
-- Staff: create + change status of own cases.
-- Admin: read all cases in their office.

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they bypass RLS internally and can be
-- composed inside policies without recursion).
-- ----------------------------------------------------------------------------
create or replace function public.current_user_office()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select office_id from public.users where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- Broaden users SELECT: members of the same office can read each other.
-- (Needed for admin dashboard to show staff names alongside their cases.)
-- This ANDs with the existing users_select_self via OR (Postgres unions
-- multiple SELECT policies).
-- ----------------------------------------------------------------------------
create policy "users_select_office_members"
  on public.users for select
  using (office_id = public.current_user_office());

-- ----------------------------------------------------------------------------
-- cases
-- ----------------------------------------------------------------------------
create type public.case_status as enum ('ongoing', 'waiting', 'done');

create table public.cases (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  client_name text not null,
  status      public.case_status not null default 'ongoing',
  assigned_to uuid not null references public.users(id) on delete cascade,
  office_id   uuid not null references public.offices(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index cases_office_idx on public.cases(office_id);
create index cases_assigned_idx on public.cases(assigned_to);

alter table public.cases enable row level security;

-- ----------------------------------------------------------------------------
-- BEFORE INSERT trigger: fill assigned_to + office_id from current auth user
-- so the app only needs to send title + client_name. Runs before RLS WITH
-- CHECK so the policy still validates the auto-filled values.
-- ----------------------------------------------------------------------------
create or replace function public.set_case_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_to is null then
    new.assigned_to := auth.uid();
  end if;
  if new.office_id is null then
    select office_id into new.office_id
      from public.users where id = new.assigned_to;
  end if;
  return new;
end;
$$;

create trigger cases_set_owner
  before insert on public.cases
  for each row execute function public.set_case_owner();

-- ----------------------------------------------------------------------------
-- BEFORE UPDATE trigger: bump updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger cases_set_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS policies
-- ----------------------------------------------------------------------------
-- Read: must be in same office, AND either be the assignee (staff)
-- or be admin (sees everyone in their office).
create policy "cases_select"
  on public.cases for select
  using (
    office_id = public.current_user_office()
    and (
      assigned_to = auth.uid()
      or public.current_user_role() = 'admin'
    )
  );

-- Insert: staff can create cases assigned to themselves in their own office.
-- (Trigger fills these, so this is the safety net.)
create policy "cases_insert_self"
  on public.cases for insert
  with check (
    assigned_to = auth.uid()
    and office_id = public.current_user_office()
  );

-- Update: only the assigned staff can modify their own case.
-- (Admin is read-only on cases for now.)
create policy "cases_update_own"
  on public.cases for update
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());
