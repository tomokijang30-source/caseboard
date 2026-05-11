import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperAdminEmail } from "@/lib/admin/auth";
import { ConfirmButton } from "@/app/cases/ConfirmButton";
import { formatKRW, withVat } from "@/lib/billing/config";
import {
  activateOneMonth,
  extendOneMonth,
  markOverdue,
  markCancelled,
} from "./actions";

export const dynamic = "force-dynamic";

type Status = "pending" | "active" | "overdue" | "cancelled";

type Row = {
  office_id: string;
  status: Status;
  plan_amount_krw: number;
  vat_included: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  last_paid_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  offices: { name: string } | null;
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "결제 대기",
  active: "사용 중",
  overdue: "연체",
  cancelled: "해지됨",
};

const STATUS_TONE: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-900",
  active: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-700",
};

const STATUS_ORDER: Record<Status, number> = {
  overdue: 0,
  pending: 1,
  active: 2,
  cancelled: 3,
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default async function AdminSubscriptionsPage() {
  const email = await getSuperAdminEmail();
  if (!email) redirect("/dashboard");

  const { data, error } = await createAdminClient()
    .from("subscriptions")
    .select(
      "office_id, status, plan_amount_krw, vat_included, current_period_start, current_period_end, last_paid_at, cancelled_at, created_at, offices(name)",
    )
    .returns<Row[]>();

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-red-600">구독 목록을 불러오지 못했습니다: {error.message}</p>
      </main>
    );
  }

  const rows = (data ?? []).slice().sort((a, b) => {
    const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (s !== 0) return s;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const counts = rows.reduce(
    (acc, r) => {
      acc[r.status]++;
      return acc;
    },
    { pending: 0, active: 0, overdue: 0, cancelled: 0 } as Record<Status, number>,
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">전체 구독 관리</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            슈퍼관리자 ({email}) — 입금 확인 후 활성화/연장하세요.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          ← 대시보드
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="결제 대기" value={counts.pending} tone="warning" />
        <Stat label="연체" value={counts.overdue} tone="danger" />
        <Stat label="사용 중" value={counts.active} tone="success" />
        <Stat label="해지" value={counts.cancelled} tone="neutral" />
      </section>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">사무실이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => {
              const total = r.vat_included
                ? r.plan_amount_krw
                : withVat(r.plan_amount_krw);
              const days = daysUntil(r.current_period_end);
              const expiringSoon =
                r.status === "active" && days !== null && days <= 7 && days >= 0;
              const expired =
                r.status === "active" && days !== null && days < 0;

              return (
                <li key={r.office_id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-gray-900">
                          {r.offices?.name ?? "(이름 없음)"}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[r.status]}`}
                        >
                          {STATUS_LABEL[r.status]}
                        </span>
                        {expired && (
                          <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800">
                            만료됨
                          </span>
                        )}
                        {expiringSoon && (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                            {days}일 후 만료
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600 sm:grid-cols-4">
                        <span>월 {formatKRW(total)} (VAT 포함)</span>
                        <span>최종입금: {fmtDate(r.last_paid_at)}</span>
                        <span>만료: {fmtDate(r.current_period_end)}</span>
                        <span className="font-mono text-[10px] text-gray-400">
                          {r.office_id.slice(0, 8)}…
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(r.status === "pending" || r.status === "overdue" || r.status === "cancelled") && (
                        <form action={activateOneMonth}>
                          <input type="hidden" name="office_id" value={r.office_id} />
                          <button
                            type="submit"
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            활성화 (1개월)
                          </button>
                        </form>
                      )}
                      {r.status === "active" && (
                        <form action={extendOneMonth}>
                          <input type="hidden" name="office_id" value={r.office_id} />
                          <button
                            type="submit"
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            1개월 연장
                          </button>
                        </form>
                      )}
                      {r.status === "active" && (
                        <form action={markOverdue}>
                          <input type="hidden" name="office_id" value={r.office_id} />
                          <ConfirmButton
                            type="submit"
                            message={`${r.offices?.name ?? "이 사무실"}을(를) 연체 처리하시겠습니까?`}
                            className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-50"
                          >
                            연체 처리
                          </ConfirmButton>
                        </form>
                      )}
                      {r.status !== "cancelled" && (
                        <form action={markCancelled}>
                          <input type="hidden" name="office_id" value={r.office_id} />
                          <ConfirmButton
                            type="submit"
                            message={`${r.offices?.name ?? "이 사무실"} 구독을 해지하시겠습니까?`}
                            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            해지
                          </ConfirmButton>
                        </form>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "danger" | "success" | "neutral";
}) {
  const cls = {
    warning: "border-amber-300 bg-amber-50 text-amber-900",
    danger: "border-red-300 bg-red-50 text-red-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    neutral: "border-gray-200 bg-white text-gray-900",
  }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${cls}`}>
      <div className="text-xs font-medium opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
