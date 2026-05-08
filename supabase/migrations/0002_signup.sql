-- CaseBoard: in-app signup
-- Replaces the placeholder trigger from 0001 with a mode-aware version that
-- reads raw_user_meta_data set by supabase.auth.signUp() in the app.

-- Allow a signed-in user to read their own office row (used by /dashboard).
create policy "offices_select_own"
  on public.offices for select
  using (
    id in (select office_id from public.users where id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Smarter user-provisioning trigger
-- ----------------------------------------------------------------------------
-- Expected metadata on signUp:
--   mode = 'create' → office_name required → user becomes admin of new office
--   mode = 'join'   → office_id   required → user becomes staff of that office
--   mode missing    → fallback: staff with no office (e.g., user added in Studio)
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

  elsif v_mode = 'join' then
    begin
      v_office_id := (new.raw_user_meta_data->>'office_id')::uuid;
    exception when others then
      raise exception 'invalid invite code';
    end;
    if not exists (select 1 from public.offices where id = v_office_id) then
      raise exception 'invite code not found';
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
