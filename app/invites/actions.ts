"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createInvite(formData: FormData) {
  const expiresInDaysRaw = String(formData.get("expires_in_days") ?? "").trim();
  const expiresInDays = expiresInDaysRaw === "" ? null : Number(expiresInDaysRaw);

  let expires_at: string | null = null;
  if (expiresInDays !== null && Number.isFinite(expiresInDays) && expiresInDays > 0) {
    const d = new Date();
    d.setDate(d.getDate() + Math.floor(expiresInDays));
    expires_at = d.toISOString();
  }

  const supabase = createClient();
  const { data: code, error: codeErr } = await supabase.rpc("gen_unique_invite_code");
  if (codeErr) {
    console.error("gen_unique_invite_code failed:", codeErr.message);
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("office_id")
    .eq("id", user!.id)
    .single();

  if (!profile?.office_id) return;

  const { error } = await supabase.from("office_invites").insert({
    code,
    office_id: profile.office_id,
    created_by: user!.id,
    expires_at,
  });
  if (error) console.error("createInvite failed:", error.message);

  revalidatePath("/dashboard");
}

export async function revokeInvite(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  if (!code) return;

  const supabase = createClient();
  const { error } = await supabase
    .from("office_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("code", code);
  if (error) console.error("revokeInvite failed:", error.message);

  revalidatePath("/dashboard");
}
