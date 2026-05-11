import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resetPassword } from "../actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">유효하지 않은 접근</h1>
          <p className="text-sm text-gray-600">
            이 페이지는 비밀번호 재설정 이메일의 링크로만 접근할 수 있습니다.
            <br />
            링크가 만료되었거나 이미 사용되었을 수 있습니다.
          </p>
          <Link
            href="/login/forgot"
            className="block rounded-md bg-gray-900 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
          >
            재설정 링크 다시 받기
          </Link>
          <Link
            href="/login"
            className="block text-center text-sm text-gray-500 hover:text-gray-900"
          >
            ← 로그인으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action={resetPassword}
        className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold">새 비밀번호 설정</h1>
          <p className="mt-1 text-sm text-gray-500">
            <b>{user.email}</b> 계정의 비밀번호를 새로 설정합니다.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-medium">새 비밀번호 (6자 이상)</span>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">비밀번호 확인</span>
          <input
            type="password"
            name="confirm"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </label>

        {searchParams.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          비밀번호 변경
        </button>
      </form>
    </main>
  );
}
