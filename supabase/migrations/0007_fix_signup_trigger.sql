-- Fix: handle_new_user 가 mode='create' 분기에서 public.users 행을 만들기 *전에*
-- public.office_invites 를 INSERT 했고, office_invites.created_by 가 public.users(id)
-- 를 FK 로 참조하기 때문에 첫 admin 생성이 항상 외래키 위반으로 실패했음.
--
-- 수정: 분기 결과(v_office_id, v_role) 만 계산해서 public.users 를 먼저 INSERT,
-- 그 다음에 (mode='create' 인 경우에만) 초기 초대 코드를 발급한다.

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

  -- public.users 를 먼저 만든다. office_invites.created_by FK 가 이걸 필요로 하므로.
  insert into public.users (id, email, name, role, office_id)
    values (new.id, new.email, v_name, v_role, v_office_id);

  -- 그 다음에 (admin 모드에 한해) 초기 초대 코드 발급.
  if v_mode = 'create' then
    insert into public.office_invites (code, office_id, created_by)
      values (public.gen_unique_invite_code(), v_office_id, new.id);
  end if;

  return new;
end;
$$;
