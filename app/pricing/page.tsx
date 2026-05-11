import Link from "next/link";
import { BILLING, formatKRW, withVat } from "@/lib/billing/config";

const PLAN = {
  name: "스탠다드",
  amountKrw: 150_000,
  vatIncluded: false,
};

const FEATURES = [
  "직원 수 무관 정액제",
  "케이스 무제한 등록",
  "대표 시점 워크로드 자동 가시화 (대기중 강조)",
  "사무실 단위 데이터 격리 (Row Level Security)",
  "변경 이력 (감사 로그)",
  "초대 코드 발급 / 회수",
  "약정 없음 — 언제든 해지",
  "매월 세금계산서 발행",
];

export default function PricingPage() {
  const totalWithVat = PLAN.vatIncluded ? PLAN.amountKrw : withVat(PLAN.amountKrw);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
        ← 로그인
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">CaseBoard 요금</h1>
        <p className="mt-1 text-sm text-gray-500">사무실 단위 정액제. 직원 수 늘어도 그대로.</p>

        <div className="mt-8 rounded-lg border-2 border-gray-900 bg-gray-50 p-6">
          <div className="text-sm font-medium text-gray-600">{PLAN.name}</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {formatKRW(PLAN.amountKrw)}
            </span>
            <span className="text-sm text-gray-500">/ 월</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {PLAN.vatIncluded ? "VAT 포함" : `VAT 별도 (총 ${formatKRW(totalWithVat)})`}
          </p>

          <ul className="mt-6 space-y-2 text-sm text-gray-700">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="mt-8 block rounded-md bg-gray-900 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
          >
            지금 시작하기
          </Link>
        </div>

        <div className="mt-6 space-y-2 text-xs text-gray-500">
          <p>가입 즉시 첫 달 결제 안내가 발송됩니다. 입금 확인 후 정식 활성화.</p>
          <p>문의: {BILLING.contactEmail}</p>
        </div>
      </div>

      <div className="flex justify-center gap-3 text-xs text-gray-400">
        <Link href="/terms" className="hover:text-gray-900">이용약관</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-gray-900">개인정보처리방침</Link>
      </div>
    </main>
  );
}
