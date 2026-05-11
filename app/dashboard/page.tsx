import { createClient } from "@/lib/supabase/server";
import { getSuperAdminEmail } from "@/lib/admin/auth";
import { signOut } from "@/app/login/actions";
import { StaffDashboard } from "./StaffDashboard";
import { AdminDashboard } from "./AdminDashboard";

export type DashboardSearchParams = {
  q?: string;
  status?: string;
  staff?: string;
};

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
