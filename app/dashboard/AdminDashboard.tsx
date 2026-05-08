import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { createInvite, revokeInvite } from "@/app/invites/actions";
import { ConfirmButton } from "@/app/cases/ConfirmButton";
import { type CaseStatus, STATUS_LABEL, STATUS_PILL } from "./status";
import {
  type DashboardSearchParams,
  StatusFilter,
  buildHref,
  isStatus,
} from "./filters";

type CaseRow = {
  id: string;
  title: string;
  client_name: string;
  status: CaseStatus;
  deadline: string | null;
  notes: string | null;
  updated_at: string;
  assigned_to: string;
};

type StaffUser = { id: string; name: string };

type Invite = {
  code: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
};

type CaseSnapshot = {
  title?: string;
  client_name?: string;
  status?: CaseStatus;
} | null;

type Event = {
  id: number;
  action: "created" | "updated" | "deleted";
  before: CaseSnapshot;
  after: CaseSnapshot;
  created_at: string;
  actor: { id: string; name: string } | null;
};

function inviteState(i: Invite): "active" | "expired" | "revoked" {
  if (i.revoked_at) return "revoked";
  if (i.expires_at && new Date(i.expires_at) <= new Date()) return "expired";
  return "active";
}

export async function AdminDashboard({
  userName,
  officeName,
  officeId,
  searchParams,
}: {
  userName: string;
  officeName: string | null;
  officeId: string | null;
  searchParams: DashboardSearchParams;
}) {
  const supabase = createClient();

  const [
    { data: staffUsersRaw },
    { data: casesRaw },
    { data: invitesRaw },
    { data: eventsRaw },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, name")
      .eq("office_id", officeId!)
      .eq("role", "staff")
      .order("name")
      .returns<StaffUser[]>(),
    supabase
      .from("cases")
      .select("id, title, client_name, status, deadline, notes, updated_at, assigned_to")
      .eq("office_id", officeId!)
      .order("updated_at", { ascending: false })
      .returns<CaseRow[]>(),
    supabase
      .from("office_invites")
      .select("code, created_at, expires_at, revoked_at")
      .eq("office_id", officeId!)
      .order("created_at", { ascending: false })
      .returns<Invite[]>(),
    supabase
      .from("case_events")
      .select("id, action, before, after, created_at, actor:users!actor_id(id, name)")
      .eq("office_id", officeId!)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<Event[]>(),
  ]);

  const staffUsers = staffUsersRaw ?? [];
  const allCases = casesRaw ?? [];
  const invites = invitesRaw ?? [];
  const events = eventsRaw ?? [];

  const counts: Record<"total" | CaseStatus, number> = {
    total: allCases.length,
    ongoing: allCases.filter((c) => c.status === "ongoing").length,
    waiting: allCases.filter((c) => c.status === "waiting").length,
    done: allCases.filter((c) => c.status === "done").length,
  };

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const statusFilter = isStatus(searchParams.status) ? searchParams.status : null;
  const staffFilter = (searchParams.staff ?? "").trim() || null;
  const hasFilter = q !== "" || statusFilter !== null || staffFilter !== null;

  const matches = (c: CaseRow) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (staffFilter && c.assigned_to !== staffFilter) return false;
    if (q && !c.title.toLowerCase().includes(q) && !c.client_name.toLowerCase().includes(q))
      return false;
    return true;
  };

  const filteredCases = allCases.filter(matches);
  const casesByStaffId = new Map<string, CaseRow[]>();
  for (const c of filteredCases) {
    const arr = casesByStaffId.get(c.assigned_to) ?? [];
    arr.push(c);
    casesByStaffId.set(c.assigned_to, arr);
  }

  const visibleStaff = staffFilter
    ? staffUsers.filter((s) => s.id === staffFilter)
    : staffUsers;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">사무실 현황</h1>
          <p className="mt-1 text-sm text-gray-600">
            {userName}님 (대표){officeName ? ` · ${officeName}` : ""}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            로그아웃
          </button>
        </form>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="총 케이스" value={counts.total} tone="neutral" />
        <SummaryCard label={STATUS_LABEL.waiting} value={counts.waiting} tone="warning" />
        <SummaryCard label={STATUS_LABEL.ongoing} value={counts.ongoing} tone="info" />
        <SummaryCard label={STATUS_LABEL.done} value={counts.done} tone="success" />
      </section>

      <InviteSection invites={invites} />

      <ActivityFeed events={events} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-700">직원별 케이스</h2>
          {hasFilter && (
            <Link
              href={{ pathname: "/dashboard" }}
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              필터 초기화
            </Link>
          )}
        </div>

        <StatusFilter searchParams={searchParams} counts={counts} />

        <form
          method="get"
          action="/dashboard"
          className="flex flex-wrap items-center gap-2"
        >
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="사건명/의뢰인 검색"
            className="min-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
          />
          <select
            name="staff"
            defaultValue={searchParams.staff ?? ""}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
          >
            <option value="">모든 직원</option>
            {staffUsers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            검색
          </button>
        </form>

        {visibleStaff.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500 shadow-sm">
            {staffUsers.length === 0
              ? "아직 합류한 직원이 없습니다. 위 초대 코드를 공유하세요."
              : "조건에 맞는 직원이 없습니다."}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleStaff.map((s) => {
              const sCases = casesByStaffId.get(s.id) ?? [];
              const sWaiting = sCases.filter((c) => c.status === "waiting").length;
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                    <div className="text-sm font-medium text-gray-900">{s.name}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">총 {sCases.length}</span>
                      {sWaiting > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                          대기중 {sWaiting}
                        </span>
                      )}
                    </div>
                  </div>

                  {sCases.length === 0 ? (
                    <p className="px-5 py-6 text-center text-xs text-gray-400">
                      {hasFilter ? "조건에 맞는 케이스 없음" : "등록된 케이스 없음"}
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {sCases.map((c) => (
                        <li key={c.id} className="px-5 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm text-gray-900">{c.title}</div>
                              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                                <span>의뢰인: {c.client_name}</span>
                                {c.deadline && <span>마감: {c.deadline}</span>}
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_PILL[c.status]}`}
                            >
                              {STATUS_LABEL[c.status]}
                            </span>
                          </div>
                          {c.notes && (
                            <p className="mt-2 line-clamp-2 whitespace-pre-wrap rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
                              {c.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function InviteSection({ invites }: { invites: Invite[] }) {
  const active = invites.filter((i) => inviteState(i) === "active");
  const inactive = invites.filter((i) => inviteState(i) !== "active");

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">직원 초대 코드</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            직원이 회원가입 시 "기존 사무실 합류" 에 입력합니다. 만료일을 지정하거나 즉시 회수할 수 있습니다.
          </p>
        </div>
        <form action={createInvite} className="flex shrink-0 items-center gap-2">
          <select
            name="expires_in_days"
            defaultValue=""
            className="rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-gray-900 focus:outline-none"
          >
            <option value="">만료 없음</option>
            <option value="1">1일</option>
            <option value="7">7일</option>
            <option value="30">30일</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
          >
            새 코드 발급
          </button>
        </form>
      </div>

      {active.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          활성 코드가 없습니다. 위에서 새 코드를 발급하세요.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {active.map((i) => (
            <li
              key={i.code}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-base font-semibold tracking-widest text-gray-900">
                  {i.code}
                </span>
                <span className="text-xs text-gray-500">
                  {i.expires_at
                    ? `만료: ${new Date(i.expires_at).toLocaleDateString("ko-KR")}`
                    : "만료 없음"}
                </span>
              </div>
              <form action={revokeInvite}>
                <input type="hidden" name="code" value={i.code} />
                <ConfirmButton
                  type="submit"
                  message={`코드 ${i.code} 를 즉시 회수하시겠습니까? 회수 후에는 사용할 수 없습니다.`}
                  className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-red-600 hover:border-red-300 hover:bg-red-50"
                >
                  회수
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      )}

      {inactive.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-900">
            지난 코드 {inactive.length}개 보기
          </summary>
          <ul className="mt-2 space-y-1">
            {inactive.map((i) => {
              const s = inviteState(i);
              return (
                <li
                  key={i.code}
                  className="flex items-center justify-between text-xs text-gray-400"
                >
                  <span className="font-mono tracking-widest line-through">{i.code}</span>
                  <span>{s === "revoked" ? "회수됨" : "만료됨"}</span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}

function ActivityFeed({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <details className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold">최근 활동</summary>
        <p className="mt-3 text-sm text-gray-500">아직 기록된 활동이 없습니다.</p>
      </details>
    );
  }

  return (
    <details className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold">
        최근 활동 <span className="font-normal text-gray-500">({events.length})</span>
      </summary>
      <ul className="mt-3 space-y-2">
        {events.map((e) => {
          const c = e.after ?? e.before;
          const caseTitle = c?.title ?? "(케이스)";
          const actorName = e.actor?.name ?? "(알 수 없음)";
          let icon = "·";
          let label: ReactNode;

          if (e.action === "created") {
            icon = "+";
            label = (
              <>
                <span className="font-medium">{actorName}</span> 님이{" "}
                <span className="font-medium">{caseTitle}</span> 등록
              </>
            );
          } else if (e.action === "deleted") {
            icon = "×";
            label = (
              <>
                <span className="font-medium">{actorName}</span> 님이{" "}
                <span className="font-medium">{caseTitle}</span> 삭제
              </>
            );
          } else if (
            e.before?.status &&
            e.after?.status &&
            e.before.status !== e.after.status
          ) {
            icon = "→";
            label = (
              <>
                <span className="font-medium">{actorName}</span> 님이{" "}
                <span className="font-medium">{caseTitle}</span>{" "}
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${STATUS_PILL[e.before.status]}`}>
                  {STATUS_LABEL[e.before.status]}
                </span>{" "}
                →{" "}
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${STATUS_PILL[e.after.status]}`}>
                  {STATUS_LABEL[e.after.status]}
                </span>
              </>
            );
          } else {
            icon = "✎";
            label = (
              <>
                <span className="font-medium">{actorName}</span> 님이{" "}
                <span className="font-medium">{caseTitle}</span> 수정
              </>
            );
          }

          return (
            <li key={e.id} className="flex items-start gap-2 text-xs text-gray-700">
              <span className="mt-0.5 w-3 shrink-0 text-center font-mono text-gray-400">
                {icon}
              </span>
              <span className="min-w-0 flex-1">{label}</span>
              <span className="shrink-0 text-[11px] text-gray-400">
                {new Date(e.created_at).toLocaleString("ko-KR", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "warning" | "info" | "success";
}) {
  const toneClass = {
    neutral: "border-gray-200 bg-white text-gray-900",
    warning: "border-amber-300 bg-amber-50 text-amber-900",
    info: "border-blue-200 bg-blue-50 text-blue-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[tone];

  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${toneClass}`}>
      <div className="text-xs font-medium opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
