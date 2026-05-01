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
  id?: string;
  primaryAsset?: string;
  confidence?: string;
  bias?: string;
  trend?: string;
  priceChangePercent?: number;
  radarScore?: number;
  volatilityScore?: number;
  momentumScore?: number;
  trendScore?: number;
  tradePlan?: TradePlan;
};

type Mover = {
  symbol: string;
  price: number;
  volatilityScore?: number;
  trendScore?: number;
  momentumScore?: number;
  radarScore?: number;
  percentageMove?: number;
  trend?: string;
  bias?: string;
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
  const bias = String(signal.bias || mover.bias || "").toLowerCase();
  const trend = String(signal.trend || mover.trend || "").toLowerCase();

  const signalRadar = Number(signal.radarScore || 0);
  const moverRadar = Number(mover.radarScore || 0);
  const volatility = Number(signal.volatilityScore || mover.volatilityScore || 0);
  const momentum = Number(signal.momentumScore || mover.momentumScore || 0);
  const trendScore = Number(signal.trendScore || mover.trendScore || 0);
  const movePercent = Math.abs(
    Number(signal.priceChangePercent || mover.percentageMove || 0)
  );

  const score = Math.max(signalRadar, moverRadar);

  const hasTradePlan = Boolean(signal.tradePlan);
  const hasHighConfidence = confidence === "high";
  const hasDirectionBias = bias === "bullish" || bias === "bearish";
  const isNotFlat = trend !== "flat";
  const hasStrongMove = movePercent >= 2;
  const hasStrongScore = score >= 75;
  const hasStrongVolatility = volatility >= 55;
  const hasTrendOrMomentum = trendScore >= 55 || momentum >= 70;
  const entryPass = isEntryStillValid(signal, mover);

  return (
    hasTradePlan &&
    hasHighConfidence &&
    hasDirectionBias &&
    isNotFlat &&
    hasStrongMove &&
    hasStrongScore &&
    hasStrongVolatility &&
    hasTrendOrMomentum &&
    entryPass
  );
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
          entry_zone_low: plan.entryZoneLow ?? plan.entryPrice,
          entry_zone_high: plan.entryZoneHigh ?? plan.entryPrice,
          stop_loss: plan.stopLoss,
          tp1: plan.takeProfits?.[0]?.price ?? null,
          tp2: plan.takeProfits?.[1]?.price ?? null,
          tp3: plan.takeProfits?.[2]?.price ?? null,
          status: "waiting",
          result_label: "WAITING",
          pnl_percent: 0,
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