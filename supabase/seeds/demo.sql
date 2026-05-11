-- ============================================================================
-- DEMO SEED — 영업용 더미 케이스 25건
--
-- 사전 조건:
--   1. /signup 폼으로 admin 1명 가입 (= 사무실 자동 생성)
--   2. /dashboard 에서 초대 코드 복사 → staff 5명 가입
--
-- 동작:
--   - 사무실 1개를 자동 선택 (가장 먼저 만들어진 것)
--   - 그 사무실의 staff 들에게 케이스 25건을 라운드로빈 배정
--   - 마감일/메모/상태 다양하게, created_at 28일~당일로 분산 → 활동 피드 자연스러움
--   - 감사 로그(actor) 도 직원 이름으로 채움
--
-- 재실행:
--   - 그냥 또 돌리면 케이스가 누적됨. 깨끗하게 다시 박을 거면 먼저:
--       delete from public.cases;  -- 사무실 1개 가정
-- ============================================================================

with
  chosen_office as (
    select id from public.offices order by created_at limit 1
  ),
  chosen_staff as (
    select u.id, row_number() over (order by u.created_at) - 1 as idx
    from public.users u
    join chosen_office o on u.office_id = o.id
    where u.role = 'staff'
  ),
  staff_count as (select greatest(count(*), 1) as n from chosen_staff),
  seed(title, client_name, status, deadline, notes, slot, days_ago) as (
    values
      ('임대차보증금반환청구',     '김민수', 'ongoing'::public.case_status, date '2026-06-15', '6/15 변론기일. 감정평가서 제출 필요',                     0, 28),
      ('손해배상(자) 후유장해',    '이서연', 'waiting'::public.case_status, date '2026-07-10', '상대방 답변서 미제출 — 송달촉탁 진행',                   1, 25),
      ('이혼 및 재산분할청구',     '박정호', 'ongoing'::public.case_status, null,              '조정 진행 중. 위자료 1억 합의 시도',                     2, 23),
      ('대여금청구',                '최영주', 'waiting'::public.case_status, date '2026-05-25', '집행권원 확보 후 압류 예정',                             3, 21),
      ('약정금청구',                '정민아', 'done'::public.case_status,    null,              '5/2 종결. 2,500만원 회수 완료',                         4, 19),
      ('매매대금청구의소',          '강현우', 'ongoing'::public.case_status, date '2026-08-20', '제3채무자 진술서 검토',                                 0, 17),
      ('상속재산분할심판',          '윤지영', 'waiting'::public.case_status, date '2026-06-30', '감정인 선임 대기',                                       1, 15),
      ('근로계약해지무효확인',      '오태현', 'ongoing'::public.case_status, date '2026-07-05', '준비서면 작성 중',                                       2, 13),
      ('명예훼손 손해배상',         '한소영', 'ongoing'::public.case_status, null,              '게시글 캡처 + 게시자 신원확인 중',                       3, 11),
      ('부당이득반환청구',          '서동훈', 'done'::public.case_status,    null,              '조정 성립 1,800만원',                                    4,  9),
      ('가압류 이의신청',           '임지원', 'waiting'::public.case_status, date '2026-05-22', '소명자료 보강 필요',                                     0,  8),
      ('유류분반환청구',            '신유리', 'ongoing'::public.case_status, date '2026-09-10', '가족관계증명서 추가 발급',                               1,  7),
      ('보증금반환청구',            '권성민', 'ongoing'::public.case_status, date '2026-06-22', '임대인 부재 송달 진행',                                  2,  6),
      ('공탁금환수청구',            '홍대근', 'waiting'::public.case_status, null,              '판결 확정 대기',                                         3,  5),
      ('부동산소유권이전등기',      '문지수', 'done'::public.case_status,    null,              '3/15 등기 완료',                                          4,  4),
      ('양육비청구 가사',           '배현철', 'ongoing'::public.case_status, date '2026-06-08', '상대방 소득자료 제출 요청',                              0,  3),
      ('가정폭력 보호명령',         '구은아', 'waiting'::public.case_status, date '2026-05-20', '상대방 의견 청취 대기',                                  1,  3),
      ('상해 형사사건',             '노태석', 'ongoing'::public.case_status, date '2026-07-15', '합의 시도 중',                                           2,  2),
      ('주거침입 형사',             '백송이', 'done'::public.case_status,    null,              '4/28 무혐의 처분',                                        3,  2),
      ('사기 형사고소',             '심재훈', 'ongoing'::public.case_status, null,              '고소장 보강 진행',                                       4,  2),
      ('위임계약해지 분쟁',         '안병호', 'waiting'::public.case_status, date '2026-06-05', '의뢰인 추가 자료 대기',                                  0,  1),
      ('주식양도양수 분쟁',         '유나래', 'ongoing'::public.case_status, date '2026-08-30', '계약서 검토 + 재무자료 분석',                            1,  1),
      ('특허침해금지 가처분',       '장하늘', 'ongoing'::public.case_status, date '2026-07-20', '기술자료 작성 중',                                       2,  1),
      ('상표권침해 손해배상',       '추성우', 'waiting'::public.case_status, null,              '침해 입증자료 수집',                                     3,  0),
      ('영업비밀침해',              '도가영', 'done'::public.case_status,    null,              '4/10 합의 종결 5,000만원',                              4,  0)
  ),
  inserted as (
    insert into public.cases
      (title, client_name, status, deadline, notes, assigned_to, office_id, created_at, updated_at)
    select
      s.title,
      s.client_name,
      s.status,
      s.deadline,
      s.notes,
      cs.id,
      co.id,
      now() - make_interval(days => s.days_ago, hours => (s.slot * 3) % 24),
      now() - make_interval(days => greatest(s.days_ago - 1, 0))
    from seed s
    cross join chosen_office co
    cross join staff_count sc
    join chosen_staff cs on cs.idx = (s.slot % sc.n)
    returning id, assigned_to, updated_at
  )
update public.case_events ce
set
  actor_id   = i.assigned_to,
  created_at = i.updated_at
from inserted i
where ce.case_id = i.id and ce.actor_id is null;
