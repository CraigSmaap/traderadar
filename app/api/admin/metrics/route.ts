import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAccessTier } from "@/lib/access";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("role, created_at");

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("status, plan, amount_cents, created_at, cancelled_at");

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const allUsers = users || [];
  const totalUsers = allUsers.length;
  const proUsers = allUsers.filter((u) => u.role === "pro" || u.role === "admin").length;
  const exnessTrialUsers = allUsers.filter((u) => u.role === "exness-trial").length;
  const freeUsers = totalUsers - proUsers - exnessTrialUsers;

  const tiers = allUsers.map((u) => resolveAccessTier(u.role, u.created_at));
  const trialUsers = tiers.filter((t) => t === "trial").length;
  const expiredUsers = tiers.filter((t) => t === "expired").length;

  const new24h = allUsers.filter((u) => new Date(u.created_at) > last24h).length;
  const new7d = allUsers.filter((u) => new Date(u.created_at) > last7d).length;

  const allSubs = subscriptions || [];
  const activeSubscriptions = allSubs.filter((s) => s.status === "active").length;
  const cancelledSubscriptions = allSubs.filter((s) => s.status === "cancelled").length;

  const monthlyRevenueCents = allSubs
    .filter((s) => s.status === "active" && s.plan === "pro")
    .reduce((sum, s) => sum + (s.amount_cents || 0), 0);

  const churnRate =
    activeSubscriptions + cancelledSubscriptions === 0
      ? 0
      : Math.round(
          (cancelledSubscriptions / (activeSubscriptions + cancelledSubscriptions)) * 100,
        );

  return NextResponse.json({
    totalUsers,
    proUsers,
    freeUsers,
    exnessTrialUsers,
    trialUsers,
    expiredUsers,
    new24h,
    new7d,
    activeSubscriptions,
    cancelledSubscriptions,
    monthlyRevenueCents,
    monthlyRevenueRand: monthlyRevenueCents / 100,
    churnRate,
  });
}
