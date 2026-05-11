import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addCaseNote } from "@/app/cases/actions";
import { StatusButtons } from "@/app/cases/StatusButtons";
import { type CaseStatus, STATUS_LABEL, STATUS_PILL } from "@/app/dashboard/status";

type CaseDetail = {
  id: string;
  title: string;
  client_name: string;
  case_no: string | null;
  status: CaseStatus;
  deadline: string | null;
  notes: string | null;
  assignee: { id: string; name: string } | null;
};

type Note = {
  id: string;
  body: string;
  created_at: string;
  author: { id: string; name: string } | null;
};

export default async function CaseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data: c }, { data: notesRaw }] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, title, client_name, case_no, status, deadline, notes, assignee:users!assigned_to(id, name)",
      )
      .eq("id", params.id)
      .single<CaseDetail>(),
    supabase
      .from("case_notes")
      .select("id, body, created_at, author:users!author_id(id, name)")
      .eq("case_id", params.id)
      .order("created_at", { ascending: false })
      .returns<Note[]>(),
  ]);

  if (!c) notFound();

  const notes = notesRaw ?? [];

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← 대시보드
      </Link>

      <header className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">{c.title}</h1>
              {c.case_no && (
                <span className="font-mono text-xs text-gray-500">
                  {c.case_no}
                </span>
              )}
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_PILL[c.status]}`}
              >
                {STATUS_LABEL[c.status]}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
              <span>의뢰인: {c.client_name}</span>
              {c.deadline && <span>마감: {c.deadline}</span>}
              {c.assignee && <span>담당: {c.assignee.name}</span>}
            </div>
          </div>
          <StatusButtons caseId={c.id} current={c.status} />
        </div>
        {c.notes && (
          <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
              이전 메모
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
              {c.notes}
            </p>
          </div>
        )}
        <div className="mt-3">
          <Link
            href={`/cases/${c.id}/edit`}
            className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-900"
          >
            정보 수정
          </Link>
        </div>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">진행 메모</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          시간순으로 누적됩니다. 한 번 등록한 메모는 수정/삭제되지 않습니다.
        </p>

        <form action={addCaseNote} className="mt-3 space-y-2">
          <input type="hidden" name="case_id" value={c.id} />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="예: 의뢰인 통화. 다음주 화 답변서 제출 예정."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              메모 추가
            </button>
          </div>
        </form>

        {notes.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            아직 진행 메모가 없습니다.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-medium text-gray-700">
                    {n.author?.name ?? "(알 수 없음)"}
                  </span>
                  <span>
                    {new Date(n.created_at).toLocaleString("ko-KR", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
