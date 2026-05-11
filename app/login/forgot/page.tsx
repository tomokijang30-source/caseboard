import Link from "next/link";
import { requestPasswordReset } from "../actions";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; sent?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">비밀번호 재설정</h1>
          <p className="mt-1 text-sm text-gray-500">
            가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다.
          </p>
        </div>

        {searchParams.sent ? (
          <div className="rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            <b>이메일을 확인해 주세요.</b>
            <br />
            재설정 링크가 발송되었습니다. 메일이 안 보이면 스팸함도 확인해 주세요.
            <br />
            <br />
            <span className="text-xs">
              혹시 가입되지 않은 이메일을 입력해도 동일한 메시지를 표시합니다 (보안 정책).
            </span>
          </div>
        ) : (
          <form action={requestPasswordReset} className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium">이메일</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
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
              재설정 링크 보내기
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500">
          <Link
            href="/login"
            className="font-medium text-gray-900 hover:underline"
          >
            ← 로그인으로
          </Link>
        </p>
      </div>
    </main>
  );
}
