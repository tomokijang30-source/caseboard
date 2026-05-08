import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { createCase, deleteCase, updateCaseStatus } from "@/app/cases/actions";
import { ConfirmButton } from "@/app/cases/ConfirmButton";
import { type CaseStatus, STATUSES, STATUS_LABEL, STATUS_PILL } from "./status";
import {
  type DashboardSearchParams,
  StatusFilter,
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
};

export async function StaffDashboard({
  userId,
  userName,
  officeName,
  searchParams,
}: {
  userId: string;
  userName: string;
  officeName: string | null;
  searchParams: DashboardSearchParams;
}) {
  const supabase = createClient();
  const { data: cases } = await supabase
    .from("cases")
    .select("id, title, client_name, status, deadline, notes, updated_at")
    .eq("assigned_to", userId)
    .order("updated_at", { ascending: false })
    .returns<CaseRow[]>();

  const all = cases ?? [];
  const counts: Record<"total" | CaseStatus, number> = {
    total: all.length,
    ongoing: all.filter((c) => c.status === "ongoing").length,
    waiting: all.filter((c) => c.status === "waiting").length,
    done: all.filter((c) => c.status === "done").length,
  };

  const filterStatus = isStatus(searchParams.status) ? searchParams.status : null;
  const list = filterStatus ? all.filter((c) => c.status === filterStatus) : all;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">내 케이스</h1>
          <p className="mt-1 text-sm text-gray-600">
            {userName}님 (직원){officeName ? ` · ${officeName}` : ""}
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

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">새 케이스 등록</h2>
        <form
          action={createCase}
          className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <input
            name="title"
            required
            placeholder="사건명"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <input
            name="client_name"
            required
            placeholder="의뢰인"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            등록
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-500">
          등록 후 카드에서 마감일·메모를 추가하세요.
        </p>
      </section>

      <StatusFilter searchParams={searchParams} counts={counts} />

      <section>
        {list.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500 shadow-sm">
            {filterStatus
              ? `'${STATUS_LABEL[filterStatus]}' 상태의 케이스가 없습니다.`
              : "등록된 케이스가 없습니다."}
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {c.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      <span>의뢰인: {c.client_name}</span>
                      {c.deadline && <span>마감: {c.deadline}</span>}
                    </div>
                  </div>

                  <form
                    action={updateCaseStatus}
                    className="flex shrink-0 items-center gap-1"
                  >
                    <input type="hidden" name="case_id" value={c.id} />
                    {STATUSES.map((s) => {
                      const active = c.status === s;
                      return (
                        <button
                          key={s}
                          type="submit"
                          name="status"
                          value={s}
                          className={
                            active
                              ? `rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_PILL[s]}`
                              : "rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-900"
                          }
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      );
                    })}
                  </form>
                </div>

                {c.notes && (
                  <p className="mt-3 whitespace-pre-wrap rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
                    {c.notes}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs">
                  <Link
                    href={`/cases/${c.id}/edit`}
                    className="rounded-md border border-gray-200 px-2.5 py-1 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                  >
                    수정
                  </Link>
                  <form action={deleteCase}>
                    <input type="hidden" name="case_id" value={c.id} />
                    <ConfirmButton
                      type="submit"
                      message="이 케이스를 삭제하시겠습니까?"
                      className="rounded-md border border-gray-200 px-2.5 py-1 text-red-600 hover:border-red-300 hover:bg-red-50"
                    >
                      삭제
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
