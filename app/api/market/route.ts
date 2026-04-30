import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTopMovers, getTopMoverSignals } from "@/lib/topMovers";

type TradePlan = {
  direction: "BUY" | "SELL";
  entryPrice: number;
  entryZoneLow?: number;
  entryZoneHigh?: number;
  stopLoss: number;
  takeProfits?: { label: string; price: number }[];
};

type Signal = {
  primaryAsset: string;
  tradePlan?: TradePlan;
};

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
  created_at: string;
};

type Mover = {
  symbol: string;
  price: number;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isPriceInEntryZone(
  price: number,
  entryLow?: number,
  entryHigh?: number,
  entry?: number
) {
  if (entryLow !== undefined && entryHigh !== undefined) {
    return price >= entryLow && price <= entryHigh;
  }

  if (entry !== undefined) {
    return Math.abs(price - entry) / entry < 0.002;
  }

  return false;
}

function calculatePnl(signal: SignalResult, currentPrice: number) {
  const entry = Number(signal.entry_price);
  const directionMultiplier = signal.direction === "BUY" ? 1 : -1;

  const pnlPoints = (currentPrice - entry) * directionMultiplier;
  const pnlPercent = entry === 0 ? 0 : (pnlPoints / entry) * 100;

  return {
    pnlPoints,
    pnlPercent,
  };
}

function getResultLabel(status: string) {
  if (status === "tp1_hit" || status === "tp2_hit" || status === "tp3_hit") {
    return "WIN";
  }

  if (status === "sl_hit") {
    return "LOSS";
  }

  if (status === "expired") {
    return "EXPIRED";
  }

  if (status === "waiting") {
    return "WAITING";
  }

  return "RUNNING";
}

function getSignalStatus(signal: SignalResult, currentPrice: number) {
  const isBuy = signal.direction === "BUY";

  const inEntry = isPriceInEntryZone(
    currentPrice,
    undefined,
    undefined,
    signal.entry_price
  );

  if (!inEntry && signal.status === "waiting") {
    return "waiting";
  }

  if (inEntry && signal.status === "waiting") {
    return "open";
  }

  if (isBuy && currentPrice <= signal.stop_loss) return "sl_hit";
  if (!isBuy && currentPrice >= signal.stop_loss) return "sl_hit";

  if (signal.tp3 !== null) {
    if (isBuy && currentPrice >= signal.tp3) return "tp3_hit";
    if (!isBuy && currentPrice <= signal.tp3) return "tp3_hit";
  }

  if (signal.tp2 !== null) {
    if (isBuy && currentPrice >= signal.tp2) return "tp2_hit";
    if (!isBuy && currentPrice <= signal.tp2) return "tp2_hit";
  }

  if (signal.tp1 !== null) {
    if (isBuy && currentPrice >= signal.tp1) return "tp1_hit";
    if (!isBuy && currentPrice <= signal.tp1) return "tp1_hit";
  }

  return signal.status;
}

function isExpired(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const now = Date.now();

  return now - created > 1000 * 60 * 60 * 12;
}

async function updateSignalStatuses(movers: Mover[]) {
  const { data, error } = await supabase.from("signal_results").select("*");

  if (error || !data) return;

  for (const signal of data as SignalResult[]) {
    const mover = movers.find(
      (m) => m.symbol.toUpperCase() === signal.asset.toUpperCase()
    );

    if (!mover) continue;

    let nextStatus = getSignalStatus(signal, mover.price);

    if (signal.status === "waiting" && isExpired(signal.created_at)) {
      nextStatus = "expired";
    }

    const pnl = calculatePnl(signal, mover.price);
    const resultLabel = getResultLabel(nextStatus);

    await supabase
      .from("signal_results")
      .update({
        status: nextStatus,
        last_price: mover.price,
        pnl_points: pnl.pnlPoints,
        pnl_percent: pnl.pnlPercent,
        result_label: resultLabel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", signal.id);
  }
}

export async function GET() {
  const movers = (await getTopMovers(10)) as Mover[];
  const signals = (await getTopMoverSignals(10)) as Signal[];

  const rows = signals.flatMap((signal) => {
    const plan = signal.tradePlan;

    if (!plan) return [];

    return [
      {
        asset: signal.primaryAsset,
        direction: plan.direction,
        entry_price: plan.entryPrice,
        stop_loss: plan.stopLoss,
        tp1: plan.takeProfits?.[0]?.price ?? null,
        tp2: plan.takeProfits?.[1]?.price ?? null,
        tp3: plan.takeProfits?.[2]?.price ?? null,
        status: "waiting",
      },
    ];
  });

  if (rows.length > 0) {
    await supabase.from("signal_results").upsert(rows, {
      onConflict: "asset,direction,entry_price,stop_loss",
    });
  }

  await updateSignalStatuses(movers);

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    movers,
    signals,
  });
}