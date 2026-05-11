-- CaseBoard: 케이스별 진행 메모 누적
-- "이 사건 지금 어디까지 갔나" 1초에 파악하기 위한 시간순 메모 (immutable).

create table public.case_notes (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.cases(id) on delete cascade,
  office_id   uuid not null references public.offices(id) on delete cascade,
  author_id   uuid not null references public.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index case_notes_case_idx on public.case_notes(case_id, created_at desc);
create index case_notes_office_idx on public.case_notes(office_id);

alter table public.case_notes enable row level security;

-- BEFORE INSERT: office_id, author_id 자동 채움
create or replace function public.set_case_note_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.author_id is null then
    new.author_id := auth.uid();
  end if;
  if new.office_id is null then
    select office_id into new.office_id
      from public.cases where id = new.case_id;
  end if;
  return new;
end;
$$;

create trigger case_notes_set_owner
  before insert on public.case_notes
  for each row execute function public.set_case_note_owner();

-- SELECT: 같은 office + (담당자 본인 또는 admin)
create policy "case_notes_select"
  on public.case_notes for select
  using (
    office_id = public.current_user_office()
    and (
      exists (
        select 1 from public.cases
        where cases.id = case_notes.case_id
          and cases.assigned_to = auth.uid()
      )
      or public.current_user_role() = 'admin'
    )
  );

-- INSERT: 본인 author_id + 같은 office + (담당자 본인 또는 admin)
create policy "case_notes_insert"
  on public.case_notes for insert
  with check (
    author_id = auth.uid()
    and office_id = public.current_user_office()
    and (
      exists (
        select 1 from public.cases
        where cases.id = case_notes.case_id
          and cases.assigned_to = auth.uid()
      )
      or public.current_user_role() = 'admin'
    )
  );

-- UPDATE / DELETE: 정책 없음 → 거부 (immutable, 감사 추적 보호)
