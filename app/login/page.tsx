import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; notice?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action={signIn}
        className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold">CaseBoard 로그인</h1>
          <p className="mt-1 text-sm text-gray-500">이메일과 비밀번호를 입력하세요.</p>
        </div>

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

        <label className="block">
          <span className="text-sm font-medium">비밀번호</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </label>

        {searchParams.notice && (
          <p className="text-sm text-emerald-700">{searchParams.notice}</p>
        )}
        {searchParams.error && (
          <p className="text-sm text-red-600">{searchParams.error}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          로그인
        </button>

        <p className="text-center text-sm text-gray-500">
          처음이신가요?{" "}
          <Link href="/signup" className="font-medium text-gray-900 hover:underline">
            회원가입
          </Link>
        </p>

        <div className="flex justify-center gap-3 pt-2 text-xs text-gray-400">
          <Link href="/terms" className="hover:text-gray-900">
            이용약관
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-gray-900">
            개인정보처리방침
          </Link>
        </div>
      </form>
    </main>
  );
}
