"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperAdminEmail } from "@/lib/admin/auth";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const ALLOWED_MONTHS = [1, 3, 6, 12] as const;

async function requireSuperAdmin() {
  const email = await getSuperAdminEmail();
  if (!email) throw new Error("forbidden");
}

function getOfficeId(formData: FormData): string {
  const id = String(formData.get("office_id") ?? "");
  if (!id) throw new Error("office_id missing");
  return id;
}

function getMonths(formData: FormData): number {
  const raw = Number(formData.get("months") ?? "1");
  if (!ALLOWED_MONTHS.includes(raw as (typeof ALLOWED_MONTHS)[number])) {
    throw new Error("invalid months value");
  }
  return raw;
}

export async function extendSubscription(formData: FormData) {
  await requireSuperAdmin();
  const officeId = getOfficeId(formData);
  const months = getMonths(formData);

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("status, current_period_start, current_period_end")
    .eq("office_id", officeId)
    .single<{
      status: string;
      current_period_start: string | null;
      current_period_end: string | null;
    }>();

  const now = new Date();
  const isActive = sub?.status === "active";
  const endDate = sub?.current_period_end ? new Date(sub.current_period_end) : null;
  const continuingActive = isActive && endDate !== null && endDate > now;

  const base = continuingActive ? endDate! : now;
  const newEnd = new Date(base.getTime() + months * MONTH_MS);

  const startISO =
    continuingActive && sub?.current_period_start
      ? sub.current_period_start
      : now.toISOString();

  const { error } = await admin
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: startISO,
      current_period_end: newEnd.toISOString(),
      last_paid_at: now.toISOString(),
      cancelled_at: null,
    })
    .eq("office_id", officeId);

  if (error) console.error("extendSubscription failed:", error.message);
  revalidatePath("/admin/subscriptions");
}

export async function markOverdue(formData: FormData) {
  await requireSuperAdmin();
  const officeId = getOfficeId(formData);

  const { error } = await createAdminClient()
    .from("subscriptions")
    .update({ status: "overdue" })
    .eq("office_id", officeId);

  if (error) console.error("markOverdue failed:", error.message);
  revalidatePath("/admin/subscriptions");
}

export async function markCancelled(formData: FormData) {
  await requireSuperAdmin();
  const officeId = getOfficeId(formData);

  const { error } = await createAdminClient()
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("office_id", officeId);

  if (error) console.error("markCancelled failed:", error.message);
  revalidatePath("/admin/subscriptions");
}

export async function deleteOffice(formData: FormData) {
  await requireSuperAdmin();
  const officeId = getOfficeId(formData);
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "삭제") {
    throw new Error("confirmation text mismatch");
  }

  const admin = createAdminClient();

  // 종속 테이블 명시적 정리. cases.notes / case_events 등은 cases CASCADE로 처리됨.
  await admin.from("case_notes").delete().eq("office_id", officeId);
  await admin.from("case_events").delete().eq("office_id", officeId);
  await admin.from("cases").delete().eq("office_id", officeId);
  await admin.from("office_invites").delete().eq("office_id", officeId);
  await admin.from("subscriptions").delete().eq("office_id", officeId);

  // users.office_id 는 ON DELETE SET NULL — auth 유저는 보존
  const { error } = await admin.from("offices").delete().eq("id", officeId);
  if (error) throw new Error("offices delete failed: " + error.message);

  revalidatePath("/admin/subscriptions");
}
