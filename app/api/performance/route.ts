import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("signal_results")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data || [];

    let balance = 1000; // 🔥 START ACCOUNT
    let peak = 1000;
    let maxDrawdown = 0;

    const equityCurve: { time: string; balance: number }[] = [];

    let wins = 0;
    let losses = 0;

    const monthlyMap: Record<string, number> = {};

    for (const r of rows) {
      // only count CLOSED trades
      if (!["tp1_hit", "tp2_hit", "tp3_hit", "sl_hit"].includes(r.status)) {
        continue;
      }

      const pnl = r.pnl_percent || 0;

      // compound balance
      balance = balance * (1 + pnl / 100);

      // track wins/losses
      if (pnl > 0) wins++;
      if (pnl < 0) losses++;

      // drawdown
      if (balance > peak) peak = balance;
      const dd = ((peak - balance) / peak) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;

      // equity curve
      equityCurve.push({
        time: r.created_at,
        balance: Number(balance.toFixed(2)),
      });

      // monthly compounding
      const date = new Date(r.created_at);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

      monthlyMap[key] =
        (monthlyMap[key] || 0) + pnl;
    }

    const monthly = Object.entries(monthlyMap).map(
      ([month, value]) => ({
        month,
        return: Number(value.toFixed(2)),
      })
    );

    const totalReturn = ((balance - 1000) / 1000) * 100;
    const totalTrades = wins + losses;
    const winRate =
      totalTrades === 0 ? 0 : (wins / totalTrades) * 100;

    return NextResponse.json({
      startBalance: 1000,
      endBalance: Number(balance.toFixed(2)),
      totalReturn: Number(totalReturn.toFixed(2)),
      winRate: Number(winRate.toFixed(2)),
      wins,
      losses,
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      equityCurve,
      monthly,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Performance failed" },
      { status: 500 }
    );
  }
}