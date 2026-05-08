import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signUp } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <form
        action={signUp}
        className="w-full max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold">CaseBoard 회원가입</h1>
          <p className="mt-1 text-sm text-gray-500">
            새 사무실을 만들거나 기존 사무실에 합류하세요.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-medium">이름</span>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </label>

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
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">가입 방식</legend>

          <label className="flex items-start gap-2 rounded-md border border-gray-200 p-3 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
            <input type="radio" name="mode" value="create" defaultChecked className="mt-1" />
            <div className="flex-1 space-y-2">
              <div className="text-sm font-medium">새 사무실 만들기 (대표)</div>
              <input
                name="office_name"
                placeholder="사무실 이름"
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
          </label>

          <label className="flex items-start gap-2 rounded-md border border-gray-200 p-3 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
            <input type="radio" name="mode" value="join" className="mt-1" />
            <div className="flex-1 space-y-2">
              <div className="text-sm font-medium">기존 사무실 합류 (직원)</div>
              <input
                name="invite_code"
                placeholder="초대 코드 (8자리)"
                maxLength={8}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm font-mono uppercase tracking-widest focus:border-gray-900 focus:outline-none"
              />
            </div>
          </label>
        </fieldset>

        {searchParams.error && (
          <p className="text-sm text-red-600">{searchParams.error}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          가입
        </button>

        <p className="text-center text-sm text-gray-500">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-medium text-gray-900 hover:underline">
            로그인
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400">
          가입 시{" "}
          <Link href="/terms" className="underline hover:text-gray-900">
            이용약관
          </Link>
          {" 및 "}
          <Link href="/privacy" className="underline hover:text-gray-900">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주됩니다.
        </p>
      </form>
    </main>
  );
}
