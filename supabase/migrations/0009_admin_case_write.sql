-- CaseBoard: 대표(admin)가 같은 사무실의 모든 사건을 수정/삭제할 수 있게.
-- 기존: cases_update_own — 담당 직원만 수정 가능 (admin은 read-only)
-- 변경: 담당 직원 OR 같은 사무실 admin

drop policy if exists "cases_update_own" on public.cases;

create policy "cases_update"
  on public.cases for update
  using (
    office_id = public.current_user_office()
    and (
      assigned_to = auth.uid()
      or public.current_user_role() = 'admin'
    )
  )
  with check (
    office_id = public.current_user_office()
    and (
      assigned_to = auth.uid()
      or public.current_user_role() = 'admin'
    )
  );

create policy "cases_delete"
  on public.cases for delete
  using (
    office_id = public.current_user_office()
    and (
      assigned_to = auth.uid()
      or public.current_user_role() = 'admin'
    )
  );
