import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCase } from "@/app/cases/actions";

export default async function CaseEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: c } = await supabase
    .from("cases")
    .select("id, title, client_name, deadline, notes")
    .eq("id", params.id)
    .single();

  if (!c) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← 대시보드
      </Link>

      <form
        action={updateCase}
        className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">케이스 수정</h1>

        <input type="hidden" name="case_id" value={c.id} />

        <label className="block">
          <span className="text-sm font-medium">사건명</span>
          <input
            name="title"
            required
            defaultValue={c.title ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">의뢰인</span>
          <input
            name="client_name"
            required
            defaultValue={c.client_name ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">마감일 (선택)</span>
          <input
            type="date"
            name="deadline"
            defaultValue={c.deadline ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">메모 (선택)</span>
          <textarea
            name="notes"
            rows={5}
            defaultValue={c.notes ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </label>

        {searchParams.error && (
          <p className="text-sm text-red-600">{searchParams.error}</p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            저장
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            취소
          </Link>
        </div>
      </form>
    </main>
  );
}
