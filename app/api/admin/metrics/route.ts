import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const totalUsers = users?.length || 0;
  const proUsers =
    users?.filter((u) => u.role === "pro" || u.role === "admin").length || 0;
  const freeUsers = totalUsers - proUsers;

  const new24h =
    users?.filter((u) => new Date(u.created_at) > last24h).length || 0;

  const new7d =
    users?.filter((u) => new Date(u.created_at) > last7d).length || 0;

  const activeSubscriptions =
    subscriptions?.filter((sub) => sub.status === "active").length || 0;

  const cancelledSubscriptions =
    subscriptions?.filter((sub) => sub.status === "cancelled").length || 0;

  const monthlyRevenueCents =
    subscriptions
      ?.filter((sub) => sub.status === "active" && sub.plan === "pro")
      .reduce((sum, sub) => sum + (sub.amount_cents || 0), 0) || 0;

  const churnRate =
    activeSubscriptions + cancelledSubscriptions === 0
      ? 0
      : Math.round(
          (cancelledSubscriptions /
            (activeSubscriptions + cancelledSubscriptions)) *
            100
        );

  return NextResponse.json({
    totalUsers,
    proUsers,
    freeUsers,
    new24h,
    new7d,
    activeSubscriptions,
    cancelledSubscriptions,
    monthlyRevenueCents,
    monthlyRevenueRand: monthlyRevenueCents / 100,
    churnRate,
  });
}