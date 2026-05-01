import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase.from("signal_results").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];

  const total = rows.length;

  const won = rows.filter((row) =>
    ["tp1_hit", "tp2_hit", "tp3_hit"].includes(row.status)
  ).length;

  const lost = rows.filter((row) => row.status === "sl_hit").length;

  const pending = rows.filter((row) =>
    ["open", "waiting", "stale"].includes(row.status)
  ).length;

  const completed = won + lost;
  const winRate = completed === 0 ? 0 : Math.round((won / completed) * 100);

  const totalReturn = rows.reduce((sum, row) => {
    return sum + Number(row.pnl_percent || 0);
  }, 0);

  const monthlyMap: Record<string, number> = {};
  const dailyMap: Record<string, number> = {};

  rows.forEach((row) => {
    const date = new Date(row.created_at);

    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    const dayKey = date.toISOString().split("T")[0];

    monthlyMap[monthKey] =
      (monthlyMap[monthKey] || 0) + Number(row.pnl_percent || 0);

    dailyMap[dayKey] =
      (dailyMap[dayKey] || 0) + Number(row.pnl_percent || 0);
  });

  const monthly = Object.entries(monthlyMap).map(([month, value]) => ({
    month,
    return: Number(value.toFixed(2)),
  }));

  const daily = Object.entries(dailyMap).map(([date, value]) => ({
    date,
    return: Number(value.toFixed(2)),
  }));

  return NextResponse.json({
    total,
    won,
    lost,
    pending,
    winRate,
    totalReturn,
    monthly,
    daily,
    rows,
  });
}