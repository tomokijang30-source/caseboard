import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BILLING, formatKRW, withVat } from "@/lib/billing/config";
import { reportPayment } from "./actions";
import { SubmitButton } from "@/app/cases/SubmitButton";

const STATUS_LABEL: Record<string, string> = {
  pending: "결제 대기",
  active: "사용 중",
  overdue: "연체",
  cancelled: "해지됨",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  active: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-700",
};

type Subscription = {
  status: "pending" | "active" | "overdue" | "cancelled";
  plan_amount_krw: number;
  vat_included: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  last_paid_at: string | null;
  last_payment_reported_at: string | null;
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { reported?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("role, office_id, offices(name)")
    .eq("id", user!.id)
    .single<{
      role: "staff" | "admin";
      office_id: string;
      offices: { name: string } | null;
    }>();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, plan_amount_krw, vat_included, current_period_start, current_period_end, last_paid_at, last_payment_reported_at")
    .eq("office_id", profile.office_id)
    .single<Subscription>();

  if (!sub) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-red-600">
          구독 정보를 불러오지 못했습니다. 관리자에게 문의하세요.
        </p>
      </main>
    );
  }

  const total = sub.vat_included ? sub.plan_amount_krw : withVat(sub.plan_amount_krw);
  const showInstructions = sub.status === "pending" || sub.status === "overdue";

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
        ← 대시보드
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">결제</h1>
            <p className="mt-0.5 text-sm text-gray-500">{profile.offices?.name} 사무실 구독</p>
          </div>
          <span className={`rounded-md px-3 py-1 text-xs font-medium ${STATUS_TONE[sub.status]}`}>
            {STATUS_LABEL[sub.status]}
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-gray-500">월 정액</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatKRW(sub.plan_amount_krw)}
              <span className="ml-1 text-xs font-normal text-gray-400">
                ({sub.vat_included ? "VAT 포함" : "VAT 별도"})
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">VAT 포함 결제액</dt>
            <dd className="mt-1 font-medium text-gray-900">{formatKRW(total)}</dd>
          </div>
          {sub.current_period_end && (
            <div>
              <dt className="text-xs text-gray-500">현재 결제 주기 종료</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {new Date(sub.current_period_end).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
              </dd>
            </div>
          )}
          {sub.last_paid_at && (
            <div>
              <dt className="text-xs text-gray-500">최종 입금</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {new Date(sub.last_paid_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
              </dd>
            </div>
          )}
        </dl>

        {searchParams.reported && (
          <div className="mt-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            ✅ <b>결제 완료 신고가 접수되었습니다.</b> 운영자가 입금을 확인하면
            보통 1시간 이내(영업 시간 기준)로 활성화/연장됩니다.
          </div>
        )}
        {searchParams.error && (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {searchParams.error}
          </div>
        )}

        {showInstructions && (
          <div
            className={
              "mt-6 rounded-lg p-4 " +
              (sub.status === "overdue"
                ? "border-2 border-red-300 bg-red-50"
                : "border border-amber-300 bg-amber-50")
            }
          >
            <h2 className="text-sm font-semibold">
              {sub.status === "overdue" ? "결제 연체 — 즉시 입금 부탁드립니다" : "첫 달 결제 안내"}
            </h2>
            <p className="mt-1 text-sm text-gray-700">
              아래 계좌로 <strong>{formatKRW(total)}</strong> 입금 후, 사업자번호와 담당자명을{" "}
              <a href={`mailto:${BILLING.contactEmail}`} className="font-medium underline">
                {BILLING.contactEmail}
              </a>
              {" "}로 보내주시면 세금계산서를 발행해드립니다.
            </p>
            <div className="mt-3 rounded-md bg-white px-3 py-2 font-mono text-sm">
              {BILLING.bankName} {BILLING.accountNumber} ({BILLING.accountHolder})
            </div>

            <form action={reportPayment} className="mt-4">
              <SubmitButton
                pendingText="신고 중..."
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                💰 결제 완료 신고
              </SubmitButton>
              <p className="mt-2 text-xs text-gray-600">
                입금하셨으면 클릭. 운영자에게 즉시 알림이 가서 확인 후
                활성화/연장됩니다.
                {sub.last_payment_reported_at && (
                  <>
                    <br />
                    <span className="text-gray-400">
                      마지막 신고:{" "}
                      {new Date(sub.last_payment_reported_at).toLocaleString(
                        "ko-KR",
                        {
                          timeZone: "Asia/Seoul",
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </>
                )}
              </p>
            </form>
          </div>
        )}

        {sub.status === "active" && (
          <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-900">
              정상 사용 중입니다. 결제 주기 종료 1주 전에 안내 메일을 보내드립니다.
            </p>
            <div className="mt-3 border-t border-emerald-200 pt-3">
              <p className="mb-2 text-xs text-emerald-900">
                <b>다음 달분 입금하셨으면 아래 버튼으로 신고해주세요.</b>{" "}
                운영자가 확인 후 1개월 연장합니다.
              </p>
              <div className="rounded-md bg-white px-3 py-2 font-mono text-sm text-gray-700">
                {BILLING.bankName} {BILLING.accountNumber} ({BILLING.accountHolder})
              </div>
              <form action={reportPayment} className="mt-3">
                <SubmitButton
                  pendingText="신고 중..."
                  className="rounded-md border border-emerald-700 bg-white px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
                >
                  💰 다음 달 결제 완료 신고
                </SubmitButton>
                {sub.last_payment_reported_at && (
                  <p className="mt-2 text-xs text-emerald-700">
                    마지막 신고:{" "}
                    {new Date(sub.last_payment_reported_at).toLocaleString(
                      "ko-KR",
                      {
                        timeZone: "Asia/Seoul",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}

        {sub.status === "cancelled" && (
          <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            구독이 해지되었습니다. 다시 시작하시려면 {BILLING.contactEmail} 로 연락주세요.
          </div>
        )}
      </div>
    </main>
  );
}
