# CaseBoard

변호사 사무실용 케이스 관리 웹앱. 직원 케이스 등록·상태 변경, 대표는 사무실 전체 워크로드 가시성.

## 1. 환경변수

```bash
cp .env.local.example .env.local
```

필수:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase Studio → Project Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 같은 화면

선택:
- `NEXT_PUBLIC_SENTRY_DSN` — 비워두면 Sentry 비활성. 채우면 자동 활성화.
- `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` — 빌드 시 소스맵 업로드용 (Vercel build env 에만 넣으세요)

## 2. Supabase Auth 설정

Authentication → Providers → Email:
- **Confirm email** 끄기 (MVP 가정). 운영 단계에서 켤 거면 SMTP (Resend/SendGrid) 연동 필수 — 안 그러면 무료 한도 (시간당 3통) 에 막힙니다.

## 3. DB 마이그레이션

Supabase SQL Editor 에서 순서대로 실행:

1. `supabase/migrations/0001_init.sql` — offices, users, user_role enum, RLS 기본
2. `supabase/migrations/0002_signup.sql` — 가입 시 사무실 생성/합류 분기 트리거
3. `supabase/migrations/0003_cases.sql` — cases + RLS + 헬퍼 함수
4. `supabase/migrations/0004_case_fields.sql` — deadline, notes, DELETE RLS
5. `supabase/migrations/0005_invites.sql` — 짧은 초대 코드 + 만료/회수
6. `supabase/migrations/0006_audit.sql`
7. `supabase/migrations/0007_fix_signup_trigger.sql`
8. `supabase/migrations/0008_subscriptions.sql` — case_events 감사 로그 + 트리거

## 4. 실행

```bash
npm install
npm run dev
```

## 5. 가입 흐름

`/login` → "회원가입":
- **새 사무실 만들기 (대표)** — 사무실 이름 입력. 가입 즉시 `/dashboard` 에 활성 초대 코드 1개 자동 발급.
- **기존 사무실 합류 (직원)** — 대표에게 받은 8자리 코드 입력.

## 6. 사용 흐름

**직원** (`/dashboard`)
- 새 케이스 등록 (사건명/의뢰인)
- 카드에서 진행중 / 대기중 / 완료 상태 변경
- 수정 페이지에서 마감일·메모 추가 가능
- 본인 케이스만 보임 (RLS 격리)

**대표** (`/dashboard`)
- 카운트 카드 4개 — **대기중 하이라이트** (페인포인트 시각화)
- 초대 코드 관리 — 발급 시 만료(없음/1/7/30일) 선택, 즉시 회수 가능
- **최근 활동** (감사 로그) — 누가 언제 어떤 케이스를 변경했는지 마지막 20건
- 검색 (사건명/의뢰인) + 상태 필터 + 직원 필터
- 직원별 카드 — 본인 케이스 + 대기중 카운트

## 7. 법무 (필수, 운영 전)

- `/privacy`, `/terms` 페이지가 placeholder 로 들어 있습니다. **법무 검토 전** 배너 그대로 두지 마세요. 변호사 친구 본인 사무실에서 의뢰인 정보 다루는 SaaS 라 개인정보보호법 컴플라이언스가 1순위 영업 이슈로 들어옵니다.
- 처리위탁(Supabase, Vercel)이 미국 소재라 국외이전 동의 절차 필요 여부 검토 필요.

## 8. 결제 운영 (수동 단계)

`/pricing` 공개 페이지에 ₩150,000/월 (VAT 별도) 표시. 가입하면 `subscriptions` 행이 자동 `pending` 상태로 생성됨. 대시보드 상단에 결제 안내 배너가 뜨고, admin 은 `/billing` 에서 계좌 정보 확인 후 입금.

입금 확인 후 사장님이 SQL Editor 에서:

```sql
update public.subscriptions
set status = 'active',
    current_period_start = now(),
    current_period_end = now() + interval '30 days',
    last_paid_at = now()
where office_id = '<해당 사무실 UUID>';
```

연체 처리 (period_end 지났을 때):

```sql
update public.subscriptions
set status = 'overdue'
where current_period_end < now() and status = 'active';
```

(추후 cron 으로 자동화)

세금계산서는 매월 홈택스에서 수동 발행. 토스페이먼츠 연동 시 자동화 예정.

## 9. 미구현

- 토스페이먼츠 자동 결제 (가맹점 심사 후 추가)
- 자동 세금계산서 발행
- 연체 시 읽기 전용 모드 강제
- SMTP 외부 연결 (Confirm email 켤 때)

## Vercel 배포

```bash
npx vercel login
npx vercel --prod
```

배포 후 Vercel Dashboard → 프로젝트 → Settings → Environment Variables 에 위 1번 항목 두 개 (Sentry 쓸 거면 DSN 도) 추가 → Redeploy.
