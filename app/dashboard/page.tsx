import { createClient } from "@/lib/supabase/server";
import { getSuperAdminEmail } from "@/lib/admin/auth";
import { signOut } from "@/app/login/actions";
import { joinOfficeAfterSignup } from "@/app/signup/actions";
import { StaffDashboard } from "./StaffDashboard";
import { AdminDashboard } from "./AdminDashboard";
import type { DashboardSearchParams } from "./filters";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile, error } = await supabase
    .from("users")
    .select("name, role, office_id, offices(name)")
    .eq("id", user!.id)
    .single<{
      name: string;
      role: "staff" | "admin";
      office_id: string | null;
      offices: { name: string } | null;
    }>();

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">대시보드</h1>
          <p className="mt-4 text-sm text-red-600">
            프로필을 불러오지 못했습니다.
            {error?.message ? ` (${error.message})` : ""}
          </p>
          <form action={signOut} className="mt-6">
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              로그아웃
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!profile.office_id) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">사무실 정보 없음</h1>
          <p className="mt-2 text-sm text-gray-600">
            <b>{profile.name}</b>님 계정이 아직 어떤 사무실에도 속해있지 않습니다.
            <br />
            대표님에게 받은 초대 코드를 입력하시면 합류됩니다.
          </p>

          {searchParams.error && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {searchParams.error}
            </p>
          )}

          <form action={joinOfficeAfterSignup} className="mt-5 space-y-3">
            <input
              name="invite_code"
              required
              placeholder="초대 코드 (예: ABCD1234)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase tracking-widest focus:border-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              사무실 합류
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            초대 코드가 없으면 대표님께 요청하세요.
          </p>

          <div className="mt-5 border-t border-gray-100 pt-4 text-center">
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-gray-500 underline hover:text-gray-900"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const officeName = profile.offices?.name ?? null;

  if (profile.role === "admin") {
    const isSuperAdmin = (await getSuperAdminEmail()) !== null;
    return (
      <AdminDashboard
        userName={profile.name}
        officeName={officeName}
        officeId={profile.office_id}
        isSuperAdmin={isSuperAdmin}
        searchParams={searchParams}
      />
    );
  }

  return (
    <StaffDashboard
      userId={user!.id}
      userName={profile.name}
      officeName={officeName}
      searchParams={searchParams}
    />
  );
}
