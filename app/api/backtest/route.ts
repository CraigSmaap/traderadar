import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runBacktest } from "@/lib/backtest";
import type { SignalResult } from "@/lib/analytics";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("signal_results")
      .select(
        "id, asset, direction, entry_price, stop_loss, tp1, tp2, tp3, status, result_label, pnl_percent, created_at"
      )
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []) as SignalResult[];
    const backtest = runBacktest(rows);

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      backtest,
      rows,
    });
  } catch (error) {
    console.error("BACKTEST API ERROR:", error);

    return NextResponse.json(
      { error: "Backtest API failed" },
      { status: 500 }
    );
  }
}