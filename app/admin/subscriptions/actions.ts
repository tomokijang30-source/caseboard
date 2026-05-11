"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperAdminEmail } from "@/lib/admin/auth";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

async function requireSuperAdmin() {
  const email = await getSuperAdminEmail();
  if (!email) throw new Error("forbidden");
}

function getOfficeId(formData: FormData): string {
  const id = String(formData.get("office_id") ?? "");
  if (!id) throw new Error("office_id missing");
  return id;
}

export async function activateOneMonth(formData: FormData) {
  await requireSuperAdmin();
  const officeId = getOfficeId(formData);

  const now = new Date();
  const end = new Date(now.getTime() + MONTH_MS);

  const { error } = await createAdminClient()
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
      last_paid_at: now.toISOString(),
      cancelled_at: null,
    })
    .eq("office_id", officeId);

  if (error) console.error("activateOneMonth failed:", error.message);
  revalidatePath("/admin/subscriptions");
}

export async function extendOneMonth(formData: FormData) {
  await requireSuperAdmin();
  const officeId = getOfficeId(formData);

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("current_period_end")
    .eq("office_id", officeId)
    .single<{ current_period_end: string | null }>();

  const now = new Date();
  const base =
    sub?.current_period_end && new Date(sub.current_period_end) > now
      ? new Date(sub.current_period_end)
      : now;
  const end = new Date(base.getTime() + MONTH_MS);

  const { error } = await admin
    .from("subscriptions")
    .update({
      status: "active",
      current_period_end: end.toISOString(),
      last_paid_at: now.toISOString(),
      cancelled_at: null,
    })
    .eq("office_id", officeId);

  if (error) console.error("extendOneMonth failed:", error.message);
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
