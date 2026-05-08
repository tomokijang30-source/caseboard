-- CaseBoard: case audit log (분쟁 대비)
-- Captures every create/update/delete on cases via triggers.
-- Admin can read events in own office; staff cannot read events in MVP.

create table public.case_events (
  id          bigserial primary key,
  case_id     uuid not null,                                          -- not FK: cases may be deleted
  office_id   uuid not null,
  actor_id    uuid references public.users(id) on delete set null,
  action      text not null check (action in ('created', 'updated', 'deleted')),
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);

create index case_events_office_idx on public.case_events(office_id, created_at desc);
create index case_events_case_idx on public.case_events(case_id, created_at desc);

alter table public.case_events enable row level security;

-- Admin only in MVP. Staff dashboards do not surface audit, so no read for them.
create policy "case_events_select_admin"
  on public.case_events for select
  using (
    office_id = public.current_user_office()
    and public.current_user_role() = 'admin'
  );

-- ----------------------------------------------------------------------------
-- Trigger function. SECURITY DEFINER so it can write regardless of caller's
-- INSERT permission on case_events (which we never granted).
-- ----------------------------------------------------------------------------
create or replace function public.log_case_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_before jsonb;
  v_after  jsonb;
begin
  if (tg_op = 'INSERT') then
    v_action := 'created';
    v_after  := to_jsonb(new);
  elsif (tg_op = 'UPDATE') then
    v_action := 'updated';
    v_before := to_jsonb(old);
    v_after  := to_jsonb(new);
  else
    v_action := 'deleted';
    v_before := to_jsonb(old);
  end if;

  insert into public.case_events (case_id, office_id, actor_id, action, before, after)
  values (
    coalesce(new.id, old.id),
    coalesce(new.office_id, old.office_id),
    auth.uid(),
    v_action,
    v_before,
    v_after
  );

  return coalesce(new, old);
end;
$$;

create trigger cases_audit_insert
  after insert on public.cases
  for each row execute function public.log_case_event();

create trigger cases_audit_update
  after update on public.cases
  for each row execute function public.log_case_event();

create trigger cases_audit_delete
  after delete on public.cases
  for each row execute function public.log_case_event();
