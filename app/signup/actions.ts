"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function fail(message: string): never {
  redirect(`/signup?error=${encodeURIComponent(message)}`);
}

function dashFail(message: string): never {
  redirect(`/dashboard?error=${encodeURIComponent(message)}`);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const mode = String(formData.get("mode") ?? "");
  const officeName = String(formData.get("office_name") ?? "").trim();
  const inviteCode = String(formData.get("invite_code") ?? "").trim().toUpperCase();

  if (!email || !password || !name) fail("이메일, 비밀번호, 이름을 모두 입력하세요.");
  if (mode !== "create" && mode !== "join") fail("가입 방식을 선택하세요.");
  if (mode === "create" && !officeName) fail("사무실 이름을 입력하세요.");
  if (mode === "join" && !inviteCode) fail("초대 코드를 입력하세요.");

  const metadata: Record<string, string> = { name, mode };
  if (mode === "create") metadata.office_name = officeName;
  if (mode === "join") metadata.invite_code = inviteCode;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (error) fail(error.message);

  if (!data.session) {
    redirect("/login?notice=" + encodeURIComponent("가입 완료. 이메일 인증 후 로그인하세요."));
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function joinOfficeAfterSignup(formData: FormData) {
  const inviteCode = String(formData.get("invite_code") ?? "").trim().toUpperCase();
  if (!inviteCode) dashFail("초대 코드를 입력하세요.");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("users")
    .select("office_id")
    .eq("id", user.id)
    .single<{ office_id: string | null }>();

  if (existing?.office_id) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("office_invites")
    .select("office_id, revoked_at, expires_at")
    .eq("code", inviteCode)
    .maybeSingle<{
      office_id: string;
      revoked_at: string | null;
      expires_at: string | null;
    }>();

  if (
    !invite ||
    invite.revoked_at ||
    (invite.expires_at && new Date(invite.expires_at) < new Date())
  ) {
    dashFail("유효하지 않거나 만료된 초대 코드입니다.");
  }

  const { error: updateError } = await admin
    .from("users")
    .update({ office_id: invite.office_id, role: "staff" })
    .eq("id", user.id);

  if (updateError) dashFail("합류 실패: " + updateError.message);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
