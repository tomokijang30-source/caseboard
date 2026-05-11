import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCase } from "@/app/cases/actions";
import { SubmitButton } from "@/app/cases/SubmitButton";

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
    .select("id, title, client_name, case_no, deadline, notes")
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
          <span className="text-sm font-medium">사건번호 (선택)</span>
          <input
            name="case_no"
            defaultValue={c.case_no ?? ""}
            placeholder="예: 2026가단12345"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">다음 기일·마감 (선택)</span>
          <input
            type="date"
            name="deadline"
            defaultValue={c.deadline ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <span className="mt-1 block text-xs text-gray-500">
            예: 답변서 제출일, 변론기일, 선고기일 등. 가장 가까운 일정만 입력하시면 대시보드에서 자동으로 위로 올라옵니다.
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium">사건 메모 (선택)</span>
          <textarea
            name="notes"
            rows={5}
            defaultValue={c.notes ?? ""}
            placeholder="예: 의뢰인 010-XXXX-XXXX, 상대방 OOO변호사, 사고 일자 2026-04-15, 핵심 쟁점·기본 정보 등"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <span className="mt-1 block text-xs text-gray-500">
            이 사건의 변치 않는 기본 정보를 정리해두는 곳. 시간순 누적되는 "진행 메모"와는 별도로, 자주 참고할 정보를 한 줄에 모아두세요.
          </span>
        </label>

        {searchParams.error && (
          <p className="text-sm text-red-600">{searchParams.error}</p>
        )}

        <div className="flex items-center gap-2">
          <SubmitButton
            pendingText="저장 중..."
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            저장
          </SubmitButton>
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
