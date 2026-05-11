"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["ongoing", "waiting", "done"] as const;
type Status = (typeof STATUSES)[number];

export async function createCase(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const client_name = String(formData.get("client_name") ?? "").trim();

  if (!title || !client_name) return;

  const supabase = createClient();
  const { error } = await supabase.from("cases").insert({ title, client_name });
  if (error) console.error("createCase failed:", error.message);

  revalidatePath("/dashboard");
}

export async function updateCaseStatus(formData: FormData) {
  const id = String(formData.get("case_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !STATUSES.includes(status as Status)) return;

  const supabase = createClient();
  const { error } = await supabase
    .from("cases")
    .update({ status })
    .eq("id", id);
  if (error) console.error("updateCaseStatus failed:", error.message);

  revalidatePath("/dashboard");
}

export async function updateCase(formData: FormData) {
  const id = String(formData.get("case_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const client_name = String(formData.get("client_name") ?? "").trim();
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();
  const caseNoRaw = String(formData.get("case_no") ?? "").trim();

  if (!id || !title || !client_name) {
    redirect(`/cases/${id}/edit?error=${encodeURIComponent("사건명과 의뢰인은 필수입니다.")}`);
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("cases")
    .update({
      title,
      client_name,
      case_no: caseNoRaw === "" ? null : caseNoRaw,
      deadline: deadlineRaw === "" ? null : deadlineRaw,
    })
    .eq("id", id);

  if (error) {
    redirect(`/cases/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function addCaseNote(formData: FormData) {
  const case_id = String(formData.get("case_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!case_id || !body) return;

  const supabase = createClient();
  const { error } = await supabase.from("case_notes").insert({ case_id, body });
  if (error) console.error("addCaseNote failed:", error.message);

  revalidatePath(`/cases/${case_id}`);
  revalidatePath("/dashboard");
}

export async function deleteCase(formData: FormData) {
  const id = String(formData.get("case_id") ?? "");
  if (!id) return;

  const supabase = createClient();
  const { error } = await supabase.from("cases").delete().eq("id", id);
  if (error) console.error("deleteCase failed:", error.message);

  revalidatePath("/dashboard");
}
