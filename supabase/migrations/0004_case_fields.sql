-- CaseBoard: extend cases with deadline + notes; allow staff to delete own cases.

alter table public.cases
  add column deadline date,
  add column notes    text;

-- Staff can delete their own cases.
create policy "cases_delete_own"
  on public.cases for delete
  using (assigned_to = auth.uid());
