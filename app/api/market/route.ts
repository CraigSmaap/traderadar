import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTopMovers, getTopMoverSignals } from "@/lib/topMovers";
import { updateSignalStatuses } from "@/lib/signals";

type TradePlan = {
  direction: "BUY" | "SELL";
  entryPrice: number;
  entryZoneLow?: number;
  entryZoneHigh?: number;
  stopLoss: number;
  takeProfits?: { label: string; price: number }[];
};

type TradeSignalForDb = {
  primaryAsset?: string;
  confidence?: string;
  radarScore?: number;
  tradePlan?: TradePlan;
};

type Mover = {
  symbol: string;
  price: number;
  volatilityScore?: number;
  trendScore?: number;
  momentumScore?: number;
  radarScore?: number;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeAsset(value?: string) {
  return (value || "").toUpperCase().replace("/", "").trim();
}

function findMoverForSignal(signal: TradeSignalForDb, movers: Mover[]) {
  const asset = normalizeAsset(signal.primaryAsset);

  return movers.find((mover) => normalizeAsset(mover.symbol) === asset);
}

function isEntryStillValid(signal: TradeSignalForDb, mover?: Mover) {
  const plan = signal.tradePlan;

  if (!plan || !mover) return false;

  const price = mover.price;
  const entryLow = plan.entryZoneLow ?? plan.entryPrice;
  const entryHigh = plan.entryZoneHigh ?? plan.entryPrice;
  const entryMid = plan.entryPrice || (entryLow + entryHigh) / 2;

  if (!entryMid || entryMid === 0) return false;

  const distanceFromEntry = Math.abs(price - entryMid) / entryMid;

  if (distanceFromEntry > 0.035) return false;

  if (plan.direction === "BUY") {
    if (price > entryHigh) return false;
    return true;
  }

  if (plan.direction === "SELL") {
    if (price < entryLow) return false;
    return true;
  }

  return false;
}

function isQualitySignal(signal: TradeSignalForDb, mover?: Mover) {
  if (!signal.tradePlan) return false;
  if (!signal.primaryAsset) return false;
  if (!mover) return false;

  const confidence = String(signal.confidence || "").toLowerCase();

  const signalRadar = Number(signal.radarScore || 0);
  const moverRadar = Number(mover.radarScore || 0);
  const volatility = Number(mover.volatilityScore || 0);
  const trend = Number(mover.trendScore || 0);
  const momentum = Number(mover.momentumScore || 0);

  const score = Math.max(signalRadar, moverRadar);

  const confidencePass =
    confidence === "high" || confidence === "medium" || confidence === "";

  const scorePass = score >= 75;
  const volatilityPass = volatility >= 55;
  const trendPass = trend >= 55 || momentum >= 70;
  const entryPass = isEntryStillValid(signal, mover);

  return confidencePass && scorePass && volatilityPass && trendPass && entryPass;
}

export async function GET() {
  try {
    console.log("STEP 1: start");

    const movers = (await getTopMovers(10)) as Mover[];
    console.log("STEP 2: movers", movers.length);

    const rawSignals = (await getTopMoverSignals(10)) as TradeSignalForDb[];
    console.log("STEP 3: raw signals", rawSignals.length);

    const qualitySignals = rawSignals
      .filter((signal) => {
        const mover = findMoverForSignal(signal, movers);
        return isQualitySignal(signal, mover);
      })
      .slice(0, 3);

    console.log("STEP 4: quality signals", qualitySignals.length);

    const rows = qualitySignals.flatMap((signal) => {
      const plan = signal.tradePlan;

      if (!plan) return [];

      return [
        {
          asset: signal.primaryAsset || "UNKNOWN",
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

    console.log("STEP 5: rows", rows.length);

    if (rows.length > 0) {
      const { error } = await supabase.from("signal_results").upsert(rows, {
        onConflict: "asset,direction,entry_price,stop_loss",
      });

      if (error) {
        console.error("UPSERT ERROR:", error);
      } else {
        console.log("STEP 6: upsert success");
      }
    }

    console.log("STEP 7: updating statuses...");
    await updateSignalStatuses(movers);

    console.log("STEP 8: DONE");

    return NextResponse.json({
      ok: true,
      movers,
      signals: qualitySignals,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("MARKET API ERROR:", error);

    return NextResponse.json(
      { error: "Market API failed" },
      { status: 500 }
    );
  }
}