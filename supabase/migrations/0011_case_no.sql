-- CaseBoard: 법원 사건번호 (예: 2026가단12345). optional.
-- 변호사 사무실 표준 식별자 — 검색/대조의 핵심 키.

alter table public.cases add column case_no text;

create index cases_case_no_idx on public.cases(case_no) where case_no is not null;
