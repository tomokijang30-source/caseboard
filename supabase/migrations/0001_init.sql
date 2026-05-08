-- CaseBoard initial schema
-- Run this in Supabase Studio → SQL Editor (or via supabase db push).
--
-- Scope of this migration: only what the login + role-display feature needs.
-- The cases table will be added in a later migration.

-- ----------------------------------------------------------------------------
-- offices
-- ----------------------------------------------------------------------------
create table public.offices (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.offices enable row level security;

-- ----------------------------------------------------------------------------
-- users  (mirrors auth.users for app-level fields like role + office)
-- ----------------------------------------------------------------------------
create type public.user_role as enum ('staff', 'admin');

create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  name       text not null,
  role       public.user_role not null default 'staff',
  office_id  uuid references public.offices(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- A signed-in user can read their own row (needed by /dashboard).
create policy "users_select_self"
  on public.users for select
  using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Auto-provision public.users on signup
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
