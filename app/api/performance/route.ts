import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  calculateLiveStats,
  type SignalResult,
} from "@/lib/analytics";
import { isExnessAllowedAsset } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeAsset(value?: string | null) {
  return (value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace("-", "")
    .replace("/", "")
    .trim();
}

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

    const rows = ((data || []) as SignalResult[]).filter((row) =>
      isExnessAllowedAsset(normalizeAsset(row.asset))
    );

    const stats = calculateLiveStats(rows);

    return NextResponse.json({ ...stats, trades: rows });
  } catch (error) {
    console.error("PERFORMANCE API ERROR:", error);

    return NextResponse.json(
      { error: "Performance API failed" },
      { status: 500 }
    );
  }
}