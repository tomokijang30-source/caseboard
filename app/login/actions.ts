"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/login/forgot?error=" + encodeURIComponent("이메일을 입력하세요."));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteOrigin()}/login/reset`,
  });

  if (error) {
    redirect("/login/forgot?error=" + encodeURIComponent(error.message));
  }

  redirect("/login/forgot?sent=1");
}

export async function resetPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) {
    redirect("/login/reset?error=" + encodeURIComponent("비밀번호는 6자 이상이어야 합니다."));
  }
  if (password !== confirm) {
    redirect("/login/reset?error=" + encodeURIComponent("비밀번호 확인이 일치하지 않습니다."));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/login/reset?error=" + encodeURIComponent(error.message));
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(
    "/login?notice=" +
      encodeURIComponent("비밀번호가 변경되었습니다. 새 비밀번호로 로그인하세요."),
  );
}
