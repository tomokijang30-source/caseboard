-- CaseBoard: short, expirable, revocable invite codes (replaces "use office.id as code").

-- ----------------------------------------------------------------------------
-- Code generation
-- ----------------------------------------------------------------------------
-- 8 chars from a 32-symbol alphabet without 0/O/1/I/L → 32^8 ≈ 1.1 × 10^12.
create or replace function public.gen_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

-- ----------------------------------------------------------------------------
-- office_invites
-- ----------------------------------------------------------------------------
create table public.office_invites (
  code        text primary key,
  office_id   uuid not null references public.offices(id) on delete cascade,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,
  revoked_at  timestamptz
);

create index office_invites_office_idx on public.office_invites(office_id);

alter table public.office_invites enable row level security;

-- Admin of the office can do everything with invites for that office.
create policy "office_invites_admin_all"
  on public.office_invites for all
  using (
    office_id = public.current_user_office()
    and public.current_user_role() = 'admin'
  )
  with check (
    office_id = public.current_user_office()
    and public.current_user_role() = 'admin'
  );

-- Wrapper that retries on rare collisions.
create or replace function public.gen_unique_invite_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_attempts int := 0;
begin
  loop
    v_code := public.gen_invite_code();
    exit when not exists (select 1 from public.office_invites where code = v_code);
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'failed to generate unique invite code';
    end if;
  end loop;
  return v_code;
end;
$$;

-- ----------------------------------------------------------------------------
-- Replace handle_new_user: use invite_code (not office_id) for join mode,
-- and auto-issue an initial invite when a new office is created.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mode        text := new.raw_user_meta_data->>'mode';
  v_name        text := coalesce(
                          nullif(trim(new.raw_user_meta_data->>'name'), ''),
                          split_part(new.email, '@', 1)
                        );
  v_office_name text;
  v_invite_code text;
  v_office_id   uuid;
  v_role        public.user_role;
begin
  if v_mode = 'create' then
    v_office_name := nullif(trim(new.raw_user_meta_data->>'office_name'), '');
    if v_office_name is null then
      raise exception 'office_name is required when mode = create';
    end if;

    insert into public.offices (name)
      values (v_office_name)
      returning id into v_office_id;
    v_role := 'admin';

    -- Issue an initial invite so the new admin lands on dashboard with a code ready.
    insert into public.office_invites (code, office_id, created_by)
    values (public.gen_unique_invite_code(), v_office_id, new.id);

  elsif v_mode = 'join' then
    v_invite_code := upper(nullif(trim(new.raw_user_meta_data->>'invite_code'), ''));
    if v_invite_code is null then
      raise exception 'invite code is required';
    end if;

    select office_id into v_office_id
    from public.office_invites
    where code = v_invite_code
      and revoked_at is null
      and (expires_at is null or expires_at > now());

    if v_office_id is null then
      raise exception 'invalid or expired invite code';
    end if;

    v_role := 'staff';

  else
    v_role := 'staff';
    v_office_id := null;
  end if;

  insert into public.users (id, email, name, role, office_id)
    values (new.id, new.email, v_name, v_role, v_office_id);

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Backfill: every existing office gets one active invite so admins of
-- pre-existing offices have a code on first dashboard load.
-- ----------------------------------------------------------------------------
insert into public.office_invites (code, office_id, created_by)
select
  public.gen_unique_invite_code(),
  o.id,
  (select id from public.users
     where office_id = o.id and role = 'admin'
     order by created_at limit 1)
from public.offices o
where not exists (
  select 1 from public.office_invites i
  where i.office_id = o.id and i.revoked_at is null
);
