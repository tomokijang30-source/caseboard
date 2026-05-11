import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperAdminEmail } from "@/lib/admin/auth";
import { ConfirmButton } from "@/app/cases/ConfirmButton";
import { formatKRW, withVat } from "@/lib/billing/config";
import {
  extendSubscription,
  markOverdue,
  markCancelled,
} from "./actions";
import { DeleteOfficeDialog } from "./DeleteOfficeDialog";

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
  offices: { name: string; is_demo: boolean } | null;
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

const EXTEND_MONTHS = [1, 3, 6, 12] as const;

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
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

function sortRows(rows: Row[]): Row[] {
  return rows.slice().sort((a, b) => {
    const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (s !== 0) return s;
    if (a.status === "active" && b.status === "active") {
      const aDays = daysUntil(a.current_period_end) ?? Infinity;
      const bDays = daysUntil(b.current_period_end) ?? Infinity;
      if (aDays !== bDays) return aDays - bDays;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default async function AdminSubscriptionsPage() {
  const email = await getSuperAdminEmail();
  if (!email) redirect("/dashboard");

  const { data, error } = await createAdminClient()
    .from("subscriptions")
    .select(
      "office_id, status, plan_amount_krw, vat_included, current_period_start, current_period_end, last_paid_at, cancelled_at, created_at, offices(name, is_demo)",
    )
    .returns<Row[]>();

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-red-600">
          구독 목록을 불러오지 못했습니다: {error.message}
        </p>
      </main>
    );
  }

  const allRows = data ?? [];
  const realRows = sortRows(allRows.filter((r) => !r.offices?.is_demo));
  const demoRows = sortRows(allRows.filter((r) => r.offices?.is_demo));

  const counts = realRows.reduce(
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
            <br />
            <span className="text-gray-400">
              아래 통계와 정렬은 실고객만 기준. 데모 사무실은 페이지 하단에 따로
              표시됩니다.
            </span>
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

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">
          실고객 ({realRows.length})
        </h2>
        <RowList rows={realRows} emptyText="등록된 실고객 사무실이 없습니다." />
      </section>

      {demoRows.length > 0 && (
        <details className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-purple-900">
            📦 데모 사무실 ({demoRows.length}) — 영업/테스트 용
          </summary>
          <p className="mt-1 text-xs text-purple-700">
            이 사무실들은 데모 데이터입니다. 영업 시연 후 삭제해도 됩니다.
          </p>
          <div className="mt-3">
            <RowList rows={demoRows} emptyText="" demoStyle />
          </div>
        </details>
      )}
    </main>
  );
}

function RowList({
  rows,
  emptyText,
  demoStyle = false,
}: {
  rows: Row[];
  emptyText: string;
  demoStyle?: boolean;
}) {
  if (rows.length === 0) {
    if (!emptyText) return null;
    return (
      <div
        className={`rounded-xl border ${demoStyle ? "border-purple-200" : "border-gray-200"} bg-white px-5 py-10 text-center text-sm text-gray-500 shadow-sm`}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border ${demoStyle ? "border-purple-200" : "border-gray-200"} bg-white shadow-sm`}
    >
      <ul className="divide-y divide-gray-100">
        {rows.map((r) => (
          <SubscriptionRow key={r.office_id} row={r} />
        ))}
      </ul>
    </div>
  );
}

function SubscriptionRow({ row: r }: { row: Row }) {
  const total = r.vat_included ? r.plan_amount_krw : withVat(r.plan_amount_krw);
  const days = daysUntil(r.current_period_end);
  const isActive = r.status === "active";
  const expired = isActive && days !== null && days < 0;
  const expiringSoon = isActive && days !== null && days >= 0 && days <= 7;
  const expiringFortnight =
    isActive && days !== null && days > 7 && days <= 14;
  const officeName = r.offices?.name ?? "(이름 없음)";
  const isDemo = !!r.offices?.is_demo;

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-gray-900">
              {officeName}
            </span>
            {isDemo && (
              <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-800">
                DEMO
              </span>
            )}
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[r.status]}`}
            >
              {STATUS_LABEL[r.status]}
            </span>
            {expired && (
              <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800">
                만료됨 ({Math.abs(days!)}일 지남)
              </span>
            )}
            {expiringSoon && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                D-{days} 만료 임박
              </span>
            )}
            {expiringFortnight && (
              <span className="rounded-md bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-900">
                D-{days}
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

        <div className="flex flex-col items-end gap-2">
          <form action={extendSubscription} className="flex flex-wrap items-center gap-1">
            <input type="hidden" name="office_id" value={r.office_id} />
            <span className="mr-1 text-[11px] text-gray-500">
              {isActive ? "연장" : "활성화"}:
            </span>
            {EXTEND_MONTHS.map((m) => (
              <button
                key={m}
                type="submit"
                name="months"
                value={m}
                className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
              >
                {m}개월
              </button>
            ))}
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {r.status === "active" && (
              <form action={markOverdue}>
                <input type="hidden" name="office_id" value={r.office_id} />
                <ConfirmButton
                  type="submit"
                  message={`${officeName}을(를) 연체 처리하시겠습니까?`}
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
                  message={`${officeName} 구독을 해지하시겠습니까?`}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  해지
                </ConfirmButton>
              </form>
            )}
            <DeleteOfficeDialog
              officeId={r.office_id}
              officeName={officeName}
              isDemo={isDemo}
            />
          </div>
        </div>
      </div>
    </li>
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
