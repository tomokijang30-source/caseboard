// 영업 데모용 시드.
// - 기존 데모 계정 + 사무실 wipe
// - admin 1 + staff 5 + cases 25 + case_notes 60+ 생성
// - 워크로드 의도적 분배 (한 명 폭주 / 한 명 정체 / 한 명 신입)
// - 마감/정체 배지가 화면에 모두 보이도록 날짜 분산
//
// 사용법:
//   1. .env.local 에 SUPABASE_SERVICE_ROLE_KEY 추가
//   2. 마이그레이션 0001~0010 모두 적용된 상태여야 함
//   3. node scripts/seed-demo.mjs

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["'](.*)["']$/, "$1");
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url) bail("NEXT_PUBLIC_SUPABASE_URL 가 .env.local 에 없습니다.");
if (!serviceKey) bail("SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 없습니다.");

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DAY = 86400000;
const NOW = Date.now();
const ts = (daysAgo) => new Date(NOW - daysAgo * DAY).toISOString();
const dateStr = (daysOffset) =>
  new Date(NOW + daysOffset * DAY).toISOString().slice(0, 10);

const ADMIN = {
  email: "demo-admin@caseboard.kr",
  password: "demo1234",
  name: "장유승",
};
const OFFICE_NAME = "행복법무법인";
const STAFF_PASSWORD = "demo1234";
const STAFF = [
  { email: "staff1@caseboard.kr", name: "김민수" }, // idx 0 - 베테랑 (8건, 일 폭주)
  { email: "staff2@caseboard.kr", name: "이서연" }, // idx 1 - 중간 (6건)
  { email: "staff3@caseboard.kr", name: "박정호" }, // idx 2 - 중간 (5건)
  { email: "staff4@caseboard.kr", name: "최영주" }, // idx 3 - 정체 (3건 모두 멈춤)
  { email: "staff5@caseboard.kr", name: "정민아" }, // idx 4 - 신입 (3건)
];
const ALL_DEMO_EMAILS = [ADMIN.email, ...STAFF.map((s) => s.email)];

// 케이스 정의: deadlineDays 는 오늘 기준 상대 (음수=지남, 양수=미래, null=없음)
// updatedDaysAgo 는 마지막 변경 시점 (정체 효과 위해 명시)
// caseNo: 법원 사건번호 (없으면 null — 접수/고소 단계 또는 신규)
// memos: 진행 메모 (시간순; daysAgo, by: 'staff'(default) 또는 'admin')
const CASES = [
  // ===== 김민수 (idx 0) — 베테랑, 8건 =====
  {
    title: "임대차보증금반환청구", caseNo: "2026가단12345", client: "강주영", status: "ongoing",
    deadlineDays: 5, createdDaysAgo: 28, updatedDaysAgo: 1, staffIdx: 0,
    memos: [
      { daysAgo: 28, body: "사건 접수. 임대차 계약서 + 보증금 입금 영수증 수령. 청구액 8,500만원" },
      { daysAgo: 24, body: "임대인에게 내용증명 발송. 7일 내 반환 요구" },
      { daysAgo: 17, body: "답변 무. 소장 초안 작성 완료" },
      { daysAgo: 10, by: "admin", body: "감정평가 받을지 의뢰인과 재상담 부탁드립니다." },
      { daysAgo: 1,  body: "감정평가 신청 완료. 5/15 1차 변론기일 확정" },
    ],
  },
  {
    title: "손해배상(자) 후유장해", caseNo: "2026가합8821", client: "임재현", status: "ongoing",
    deadlineDays: -2, createdDaysAgo: 22, updatedDaysAgo: 5, staffIdx: 0,
    memos: [
      { daysAgo: 22, body: "교통사고. 후유장해 12급 진단서 수령" },
      { daysAgo: 15, body: "보험사 합의금 4,000만원 제시 — 거절 통보" },
      { daysAgo: 5,  body: "추가 진료기록 수령. 청구액 8,500만원으로 상향" },
    ],
  },
  {
    title: "매매대금청구의소", caseNo: "2026가합11457", client: "강현우", status: "waiting",
    deadlineDays: 2, createdDaysAgo: 17, updatedDaysAgo: 3, staffIdx: 0,
    memos: [
      { daysAgo: 17, body: "매매계약 검토. 청구액 1억 2천만원" },
      { daysAgo: 10, body: "상대방 답변서 미제출. 송달촉탁 신청" },
      { daysAgo: 3,  body: "송달증명원 수령. 변론기일 지정 대기" },
    ],
  },
  {
    title: "보증금반환청구", caseNo: "2026가단9923", client: "권성민", status: "ongoing",
    deadlineDays: 43, createdDaysAgo: 6, updatedDaysAgo: 1, staffIdx: 0,
    memos: [
      { daysAgo: 6, body: "임대차 만료 후 미반환. 임대인 부재 송달 어려움" },
      { daysAgo: 1, body: "공시송달 신청 완료" },
    ],
  },
  {
    title: "양육비청구", caseNo: "2026드단3387", client: "배현철", status: "ongoing",
    deadlineDays: 29, createdDaysAgo: 3, updatedDaysAgo: 1, staffIdx: 0,
    memos: [
      { daysAgo: 3, body: "양육비 산정기준표 분석. 월 80만원 청구 예정" },
      { daysAgo: 1, body: "상대방 소득자료 제출 요청 — 답신 대기" },
    ],
  },
  {
    title: "사기 형사고소", caseNo: null, client: "심재훈", status: "ongoing",
    deadlineDays: null, createdDaysAgo: 2, updatedDaysAgo: 0, staffIdx: 0,
    memos: [
      { daysAgo: 2, body: "투자 사기 혐의. 피해액 3,200만원" },
      { daysAgo: 0, body: "고소장 보강 — 입금 내역 + 카톡 캡처 첨부" },
    ],
  },
  {
    title: "주식양도양수 분쟁", caseNo: "2026가합13822", client: "유나래", status: "ongoing",
    deadlineDays: 112, createdDaysAgo: 1, updatedDaysAgo: 0, staffIdx: 0,
    memos: [
      { daysAgo: 1, body: "주식양도 계약서 검토 + 재무자료 분석 시작" },
    ],
  },
  {
    title: "영업비밀침해", caseNo: "2026가합10204", client: "도가영", status: "done",
    deadlineDays: null, createdDaysAgo: 18, updatedDaysAgo: 0, staffIdx: 0,
    memos: [
      { daysAgo: 18, body: "전 직원의 고객DB 유출. 영업비밀 침해 + 손해배상 청구" },
      { daysAgo: 14, body: "내용증명 발송 — 사용금지 + 1억 손해배상" },
      { daysAgo: 8,  body: "조정 시도 — 5,000만원 + 사용금지 합의안" },
      { daysAgo: 2,  body: "조정 성립. 5,000만원 + 영구 사용금지 약정" },
      { daysAgo: 0,  body: "마무리: 합의금 입금 확인 완료. 종결" },
    ],
  },

  // ===== 이서연 (idx 1) — 중간, 6건 =====
  {
    title: "이혼 및 재산분할청구", caseNo: "2026드합2761", client: "송예린", status: "ongoing",
    deadlineDays: null, createdDaysAgo: 23, updatedDaysAgo: 2, staffIdx: 1,
    memos: [
      { daysAgo: 23, body: "이혼 사유 협의. 재산분할 비율 5:5 vs 6:4 쟁점" },
      { daysAgo: 18, body: "재산목록 작성 — 부동산 2건 + 예적금 + 주식" },
      { daysAgo: 10, body: "조정 1차 — 위자료 1억 합의 시도" },
      { daysAgo: 2,  body: "상대방 위자료 5천 역제안. 의뢰인 검토 중" },
    ],
  },
  {
    title: "상속재산분할심판", caseNo: "2026느합891", client: "윤지영", status: "waiting",
    deadlineDays: 51, createdDaysAgo: 15, updatedDaysAgo: 4, staffIdx: 1,
    memos: [
      { daysAgo: 15, body: "공동상속인 4명. 부동산 평가가 핵심 쟁점" },
      { daysAgo: 9,  body: "감정인 선임 신청" },
      { daysAgo: 4,  body: "감정인 선임 통지 수령. 일정 조율 중" },
    ],
  },
  {
    title: "명예훼손 손해배상", caseNo: "2026가단14502", client: "한소영", status: "ongoing",
    deadlineDays: null, createdDaysAgo: 11, updatedDaysAgo: 1, staffIdx: 1,
    memos: [
      { daysAgo: 11, body: "온라인 명예훼손 게시글 다수. 청구액 3천만원" },
      { daysAgo: 6,  body: "게시글 캡처 + 작성자 IP 추적 의뢰" },
      { daysAgo: 1,  body: "게시자 신원 확인 — 동종업계 경쟁업체로 판명" },
    ],
  },
  {
    title: "가압류 이의신청", caseNo: "2026카합552", client: "임지원", status: "waiting",
    deadlineDays: 3, createdDaysAgo: 8, updatedDaysAgo: 2, staffIdx: 1,
    memos: [
      { daysAgo: 8, body: "예금 가압류 이의신청 접수" },
      { daysAgo: 2, body: "소명자료 — 거래내역서 추가 보강 중" },
    ],
  },
  {
    title: "가정폭력 보호명령", caseNo: "2026수1227", client: "구은아", status: "waiting",
    deadlineDays: -1, createdDaysAgo: 3, updatedDaysAgo: 0, staffIdx: 1,
    memos: [
      { daysAgo: 3, body: "긴급임시조치 신청 — 접근금지 + 퇴거명령" },
      { daysAgo: 0, body: "5/9 상대방 의견청취 기일. 결과 대기" },
    ],
  },
  {
    title: "위임계약해지 분쟁", caseNo: null, client: "안병호", status: "waiting",
    deadlineDays: 26, createdDaysAgo: 1, updatedDaysAgo: 0, staffIdx: 1,
    memos: [
      { daysAgo: 1, body: "위임계약 해지 통보 + 손해배상 청구 사건 접수" },
    ],
  },

  // ===== 박정호 (idx 2) — 중간, 5건 =====
  {
    title: "대여금청구", caseNo: "2026가단7799", client: "백상혁", status: "waiting",
    deadlineDays: 15, createdDaysAgo: 21, updatedDaysAgo: 5, staffIdx: 2,
    memos: [
      { daysAgo: 21, body: "차용증 + 입금증 수령. 원금 5천만원 + 이자 청구" },
      { daysAgo: 14, body: "지급명령 신청" },
      { daysAgo: 5,  body: "이의신청 — 본안소송으로 전환" },
    ],
  },
  {
    title: "근로계약해지무효확인", caseNo: "2026가합9912", client: "오태현", status: "ongoing",
    deadlineDays: 56, createdDaysAgo: 13, updatedDaysAgo: 2, staffIdx: 2,
    memos: [
      { daysAgo: 13, body: "부당해고 사건. 1심 청구" },
      { daysAgo: 7,  body: "회사측 답변서 — 징계해고 주장" },
      { daysAgo: 2,  body: "준비서면 작성 중. 동료 진술서 3건 수령" },
    ],
  },
  {
    title: "유류분반환청구", caseNo: "2026가합12771", client: "신유리", status: "ongoing",
    deadlineDays: 123, createdDaysAgo: 7, updatedDaysAgo: 1, staffIdx: 2,
    memos: [
      { daysAgo: 7, body: "부친 사망. 유언장 일방적 → 유류분 반환 청구" },
      { daysAgo: 1, body: "가족관계증명서 + 부동산 등기부 추가 수령" },
    ],
  },
  {
    title: "상해 형사사건", caseNo: "2026고단2204", client: "노태석", status: "ongoing",
    deadlineDays: 66, createdDaysAgo: 2, updatedDaysAgo: 0, staffIdx: 2,
    memos: [
      { daysAgo: 2, body: "쌍방 상해. 합의 우선 시도 중" },
      { daysAgo: 0, body: "상대방 변호인과 합의금 1차 협의" },
    ],
  },
  {
    title: "특허침해금지 가처분", caseNo: "2026카합1108", client: "장하늘", status: "ongoing",
    deadlineDays: 71, createdDaysAgo: 1, updatedDaysAgo: 0, staffIdx: 2,
    memos: [
      { daysAgo: 1, body: "특허 침해 가처분 신청. 기술자료 작성 시작" },
    ],
  },

  // ===== 최영주 (idx 3) — 정체 직원, 3건 모두 멈춤 =====
  {
    title: "부동산이전등기 청구", caseNo: "2026가단11203", client: "박서영", status: "ongoing",
    deadlineDays: null, createdDaysAgo: 14, updatedDaysAgo: 14, staffIdx: 3,
    memos: [
      { daysAgo: 14, body: "잔금 미지급 상태에서 매도인이 등기 거부" },
    ],
  },
  {
    title: "명도소송", caseNo: "2026가단10458", client: "황진우", status: "waiting",
    deadlineDays: 20, createdDaysAgo: 10, updatedDaysAgo: 10, staffIdx: 3,
    memos: [
      { daysAgo: 10, body: "임차인 명도 소송 접수. 첫 변론 미정" },
    ],
  },
  {
    title: "약정금 반환청구", caseNo: "2026가단9876", client: "신도윤", status: "ongoing",
    deadlineDays: -7, createdDaysAgo: 12, updatedDaysAgo: 8, staffIdx: 3,
    memos: [
      { daysAgo: 12, body: "약정금 미반환. 청구액 6,000만원" },
      { daysAgo: 8,  body: "상대방 답변서 수령. 분석 중" },
    ],
  },

  // ===== 정민아 (idx 4) — 신입, 3건 =====
  {
    title: "약정금청구", caseNo: "2026가단7212", client: "정수민", status: "done",
    deadlineDays: null, createdDaysAgo: 19, updatedDaysAgo: 0, staffIdx: 4,
    memos: [
      { daysAgo: 19, body: "약정금 미지급. 청구액 2,500만원" },
      { daysAgo: 12, body: "내용증명 → 답변 무" },
      { daysAgo: 5,  body: "지급명령 → 이의신청 → 본안 소송 전환" },
      { daysAgo: 0,  body: "마무리: 조정 성립. 2,500만원 회수 완료" },
    ],
  },
  {
    title: "부당이득반환청구", caseNo: "2026가단7711", client: "서동훈", status: "done",
    deadlineDays: null, createdDaysAgo: 9, updatedDaysAgo: 0, staffIdx: 4,
    memos: [
      { daysAgo: 9, body: "잘못 송금된 1,800만원 반환 청구" },
      { daysAgo: 5, body: "상대방 부분반환 800만원 입금" },
      { daysAgo: 2, body: "잔액 1,000만원 합의 진행" },
      { daysAgo: 0, body: "마무리: 1,800만원 전액 회수 완료. 종결" },
    ],
  },
  {
    title: "상표권침해 손해배상", caseNo: null, client: "추성우", status: "waiting",
    deadlineDays: null, createdDaysAgo: 0, updatedDaysAgo: 0, staffIdx: 4,
    memos: [
      { daysAgo: 0, body: "상표권 침해 사건 접수. 침해 입증자료 수집 시작" },
    ],
  },
];

// =============================================================================
// 1) WIPE: 기존 데모 계정 + 사무실 + 관련 데이터 제거
// =============================================================================
console.log("→ 기존 데모 데이터 wipe");
const { data: page } = await sb.auth.admin.listUsers({ perPage: 200 });
const existingDemo = (page?.users ?? []).filter((u) =>
  ALL_DEMO_EMAILS.includes(u.email),
);

if (existingDemo.length > 0) {
  const ids = existingDemo.map((u) => u.id);
  const { data: profiles } = await sb
    .from("users")
    .select("office_id")
    .in("id", ids);
  const officeIds = [
    ...new Set((profiles ?? []).map((p) => p.office_id).filter(Boolean)),
  ];

  if (officeIds.length > 0) {
    await sb.from("case_events").delete().in("office_id", officeIds);
    await sb.from("offices").delete().in("id", officeIds);
  }
  for (const u of existingDemo) {
    await sb.auth.admin.deleteUser(u.id);
  }
  console.log(`  ${existingDemo.length}개 계정 + ${officeIds.length}개 사무실 제거`);
}

// =============================================================================
// 2) ADMIN
// =============================================================================
console.log("\n→ 대표 계정 생성");
const { data: adminUser, error: adminErr } = await sb.auth.admin.createUser({
  email: ADMIN.email,
  password: ADMIN.password,
  email_confirm: true,
  user_metadata: { mode: "create", name: ADMIN.name, office_name: OFFICE_NAME },
});
if (adminErr) bail(`대표 생성 실패: ${adminErr.message}`);
const adminId = adminUser.user.id;

const { data: profile, error: profileErr } = await sb
  .from("users").select("office_id").eq("id", adminId).single();
if (profileErr) bail(`profile 조회 실패: ${profileErr.message}`);
const officeId = profile.office_id;

const { data: invite } = await sb
  .from("office_invites")
  .select("code")
  .eq("office_id", officeId)
  .is("revoked_at", null)
  .order("created_at")
  .limit(1)
  .single();
const code = invite.code;
console.log(`  사무실: ${OFFICE_NAME} / 초대코드 ${code}`);

// =============================================================================
// 3) STAFF 5명
// =============================================================================
console.log("\n→ 직원 5명 생성");
const staffIds = [];
for (const s of STAFF) {
  const { data, error } = await sb.auth.admin.createUser({
    email: s.email,
    password: STAFF_PASSWORD,
    email_confirm: true,
    user_metadata: { mode: "join", name: s.name, invite_code: code },
  });
  if (error) {
    console.error(`  ${s.name}: ${error.message}`);
    staffIds.push(null);
    continue;
  }
  staffIds.push(data.user.id);
  console.log(`  ${s.name}  ${s.email}`);
}

// =============================================================================
// 4) CASES 25건
// =============================================================================
console.log(`\n→ 케이스 ${CASES.length}건 등록`);
const caseRows = CASES.map((c) => ({
  title: c.title,
  client_name: c.client,
  case_no: c.caseNo ?? null,
  status: c.status,
  deadline: c.deadlineDays === null ? null : dateStr(c.deadlineDays),
  notes: null,
  assigned_to: staffIds[c.staffIdx],
  office_id: officeId,
  created_at: ts(c.createdDaysAgo),
  updated_at: ts(c.updatedDaysAgo),
}));
const { data: insertedCases, error: caseErr } = await sb
  .from("cases")
  .insert(caseRows)
  .select("id, assigned_to, updated_at");
if (caseErr) bail(`케이스 등록 실패: ${caseErr.message}`);

// =============================================================================
// 5) CASE_NOTES (시간순 진행 메모)
// =============================================================================
console.log(`\n→ 진행 메모 등록`);
const noteRows = [];
for (let i = 0; i < CASES.length; i++) {
  const c = CASES[i];
  const ic = insertedCases[i];
  for (const m of c.memos) {
    noteRows.push({
      case_id: ic.id,
      office_id: officeId,
      author_id: m.by === "admin" ? adminId : ic.assigned_to,
      body: m.body,
      created_at: ts(m.daysAgo),
    });
  }
}
const { error: noteErr } = await sb.from("case_notes").insert(noteRows);
if (noteErr) bail(`메모 등록 실패: ${noteErr.message}`);
console.log(`  ${noteRows.length}개 메모 추가`);

// =============================================================================
// 6) case_events actor_id / created_at 보정 (활동 피드용)
// =============================================================================
console.log("\n→ 감사 로그 actor 보정");
await Promise.all(
  insertedCases.map((c) =>
    sb
      .from("case_events")
      .update({ actor_id: c.assigned_to, created_at: c.updated_at })
      .eq("case_id", c.id)
      .is("actor_id", null),
  ),
);

// =============================================================================
// 7) 구독 active
// =============================================================================
await sb
  .from("subscriptions")
  .update({
    status: "active",
    current_period_start: ts(0),
    current_period_end: ts(-30),
    last_paid_at: ts(0),
  })
  .eq("office_id", officeId);

console.log("\n✓ 데모 데이터 준비 완료\n");
console.log("━".repeat(60));
console.log(` 대표:    ${ADMIN.email}    /  ${ADMIN.password}`);
console.log(` 직원1~5: staff[1-5]@caseboard.kr  /  ${STAFF_PASSWORD}`);
console.log(` 사무실:  ${OFFICE_NAME}`);
console.log(` 초대코드: ${code}`);
console.log("━".repeat(60));
console.log("\n영업 멘트 시연 포인트:");
console.log("  · 직원별 워크로드 차이: 김민수 8건 vs 최영주/정민아 3건");
console.log("  · 마감 지남(빨강) 3건 / 임박(주황) 2건");
console.log("  · 정체 배지: 최영주 3건 모두 멈춤 → 페인 직격");
console.log("  · 사건 클릭 → 진행 메모 타임라인 (변호사 일하는 흐름 그대로)");

function bail(msg) {
  console.error("✗ " + msg);
  process.exit(1);
}
