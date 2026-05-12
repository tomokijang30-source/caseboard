"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BILLING, formatKRW, withVat } from "@/lib/billing/config";

async function sendDiscordNotification(content: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn("DISCORD_WEBHOOK_URL not set — skipping notification");
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch (e) {
    console.error("Discord webhook failed:", e);
  }
}

export async function reportPayment() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, office_id, name, offices(name)")
    .eq("id", user.id)
    .single<{
      role: "staff" | "admin";
      office_id: string;
      name: string;
      offices: { name: string } | null;
    }>();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan_amount_krw, vat_included, status")
    .eq("office_id", profile.office_id)
    .single<{
      plan_amount_krw: number;
      vat_included: boolean;
      status: string;
    }>();

  const now = new Date();
  const { error: updateErr } = await admin
    .from("subscriptions")
    .update({ last_payment_reported_at: now.toISOString() })
    .eq("office_id", profile.office_id);

  if (updateErr) {
    redirect(
      `/billing?error=${encodeURIComponent("신고 처리 실패: " + updateErr.message)}`,
    );
  }

  const officeName = profile.offices?.name ?? "(이름 없음)";
  const total = sub
    ? sub.vat_included
      ? sub.plan_amount_krw
      : withVat(sub.plan_amount_krw)
    : 0;
  const krwTime = now.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const adminUrl = baseUrl
    ? `${baseUrl}/admin/subscriptions`
    : "/admin/subscriptions";

  await sendDiscordNotification(
    [
      "**[결제 완료 신고]**",
      `사무실: **${officeName}**`,
      `대표: ${profile.name} (${user.email})`,
      `예상 금액: ${formatKRW(total)} (VAT 포함)`,
      `현재 상태: ${sub?.status ?? "unknown"}`,
      `신고 시각: ${krwTime}`,
      ``,
      `→ 토스 확인 후 어드민에서 활성화/연장`,
      adminUrl,
    ].join("\n"),
  );

  revalidatePath("/billing");
  redirect("/billing?reported=1");
}
