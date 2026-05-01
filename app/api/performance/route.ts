import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type SignalResult = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  stop_loss: number;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  status: string;
  result_label: string | null;
  pnl_percent: number | null;
  created_at: string;
};

type EquityPoint = {
  time: string;
  balance: number;
};

const START_BALANCE = 100;
const RISK_PER_TRADE_PERCENT = 1;
const DAILY_MAX_LOSS_PERCENT = -3;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isClosedTrade(status: string) {
  return ["tp1_hit", "tp2_hit", "tp3_hit", "sl_hit"].includes(status);
}

function getExitPrice(row: SignalResult) {
  if (row.status === "tp3_hit" && row.tp3 !== null) return row.tp3;
  if (row.status === "tp2_hit" && row.tp2 !== null) return row.tp2;
  if (row.status === "tp1_hit" && row.tp1 !== null) return row.tp1;
  if (row.status === "sl_hit") return row.stop_loss;

  return row.entry_price;
}

function calculateRiskBasedReturn(row: SignalResult) {
  const entry = Number(row.entry_price || 0);
  const stopLoss = Number(row.stop_loss || 0);
  const exitPrice = Number(getExitPrice(row) || 0);

  if (entry === 0 || stopLoss === 0 || exitPrice === 0) return 0;

  const riskDistance = Math.abs(entry - stopLoss);
  if (riskDistance === 0) return 0;

  const rewardDistance =
    row.direction === "BUY" ? exitPrice - entry : entry - exitPrice;

  const riskReward = rewardDistance / riskDistance;

  return riskReward * RISK_PER_TRADE_PERCENT;
}

function getMonthKey(dateValue: string) {
  const date = new Date(dateValue);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function getDayKey(dateValue: string) {
  return new Date(dateValue).toISOString().split("T")[0];
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

    const rows = (data || []) as SignalResult[];

    const total = rows.length;
    const pending = rows.filter((row) =>
      ["waiting", "open", "stale"].includes(row.status)
    ).length;

    const closedRows = rows.filter((row) => isClosedTrade(row.status));

    let balance = START_BALANCE;
    let peak = START_BALANCE;
    let maxDrawdown = 0;

    let wins = 0;
    let losses = 0;
    let skippedByDailyLimit = 0;

    let currentDay = "";
    let dailyRunningReturn = 0;

    const equityCurve: EquityPoint[] = [];
    const monthlyMap: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};

    for (const row of closedRows) {
      const dayKey = getDayKey(row.created_at);

      if (dayKey !== currentDay) {
        currentDay = dayKey;
        dailyRunningReturn = 0;
      }

      if (dailyRunningReturn <= DAILY_MAX_LOSS_PERCENT) {
        skippedByDailyLimit += 1;
        continue;
      }

      const tradeReturnPercent = calculateRiskBasedReturn(row);

      dailyRunningReturn += tradeReturnPercent;

      balance = balance * (1 + tradeReturnPercent / 100);

      if (tradeReturnPercent > 0) wins += 1;
      if (tradeReturnPercent < 0) losses += 1;

      if (balance > peak) peak = balance;

      const drawdown = ((peak - balance) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      equityCurve.push({
        time: row.created_at,
        balance: Number(balance.toFixed(2)),
      });

      const monthKey = getMonthKey(row.created_at);

      monthlyMap[monthKey] =
        (monthlyMap[monthKey] || 0) + tradeReturnPercent;

      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + tradeReturnPercent;
    }

    const monthly = Object.entries(monthlyMap).map(([month, value]) => ({
      month,
      return: Number(value.toFixed(2)),
    }));

    const daily = Object.entries(dailyMap).map(([date, value]) => ({
      date,
      return: Number(value.toFixed(2)),
    }));

    const completed = wins + losses;
    const winRate = completed === 0 ? 0 : (wins / completed) * 100;
    const totalReturn = ((balance - START_BALANCE) / START_BALANCE) * 100;

    return NextResponse.json({
      total,
      pending,

      won: wins,
      lost: losses,
      wins,
      losses,

      startBalance: START_BALANCE,
      endBalance: Number(balance.toFixed(2)),
      riskPerTradePercent: RISK_PER_TRADE_PERCENT,
      dailyMaxLossPercent: DAILY_MAX_LOSS_PERCENT,
      skippedByDailyLimit,

      winRate: Number(winRate.toFixed(2)),
      totalReturn: Number(totalReturn.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),

      equityCurve,
      monthly,
      daily,
      rows,
    });
  } catch (error) {
    console.error("PERFORMANCE API ERROR:", error);

    return NextResponse.json(
      { error: "Performance API failed" },
      { status: 500 }
    );
  }
}