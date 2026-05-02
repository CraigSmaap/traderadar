import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTopMovers, getTopMoverSignals } from "@/lib/topMovers";
import { updateSignalStatuses } from "@/lib/signals";
import { getCurrentSession } from "@/lib/session";

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
  assetClass?: string;
  volatilityScore?: number;
  trendScore?: number;
  momentumScore?: number;
  radarScore?: number;
  percentageMove?: number;
  trend?: string;
  bias?: string;
};

type ExistingSignal = {
  asset: string;
  status: string;
  created_at: string;
};

type RankedSignal = TradeSignalForDb & {
  finalScore: number;
  rankingReasons: string[];
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CRYPTO_ASSETS = [
  "BTC",
  "BTCUSD",
  "BTC/USD",
  "ETH",
  "ETHUSD",
  "ETH/USD",
  "SOL",
  "SOLUSD",
  "SOL/USD",
  "XRP",
  "XRPUSD",
  "XRP/USD",
];

const MAX_NEW_SIGNALS = 3;
const ASSET_COOLDOWN_MINUTES = 45;

function normalizeAsset(value?: string) {
  return (value || "").toUpperCase().replace("/", "").trim();
}

function isCryptoAsset(value?: string) {
  const asset = normalizeAsset(value);
  return CRYPTO_ASSETS.map(normalizeAsset).includes(asset);
}

function getSessionBoostValue(asset?: string) {
  if (isCryptoAsset(asset)) return 10;

  const session = getCurrentSession();

  if (session === "overlap") return 15;
  if (session === "london" || session === "newyork") return 10;

  return 0;
}

function getScoreThreshold(asset?: string) {
  if (isCryptoAsset(asset)) return 70;

  const sessionBoost = getSessionBoostValue(asset);

  return sessionBoost === 0 ? 65 : 75;
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

function getSignalBaseScore(signal: TradeSignalForDb, mover?: Mover) {
  const signalRadar = Number(signal.radarScore || 0);
  const moverRadar = Number(mover?.radarScore || 0);

  return Math.max(signalRadar, moverRadar);
}

function calculateFinalScore(signal: TradeSignalForDb, mover?: Mover) {
  const reasons: string[] = [];

  const baseScore = getSignalBaseScore(signal, mover);
  const volatility = Number(signal.volatilityScore || mover?.volatilityScore || 0);
  const momentum = Number(signal.momentumScore || mover?.momentumScore || 0);
  const trendScore = Number(signal.trendScore || mover?.trendScore || 0);
  const movePercent = Math.abs(
    Number(signal.priceChangePercent || mover?.percentageMove || 0)
  );

  const confidence = String(signal.confidence || "").toLowerCase();
  const crypto = isCryptoAsset(signal.primaryAsset);
  const sessionBoost = getSessionBoostValue(signal.primaryAsset);

  let finalScore = baseScore;

  if (confidence === "high") {
    finalScore += 8;
    reasons.push("high-confidence");
  }

  if (confidence === "medium" && crypto) {
    finalScore += 4;
    reasons.push("crypto-medium-confidence");
  }

  if (volatility >= 75) {
    finalScore += 6;
    reasons.push("strong-volatility");
  } else if (volatility >= 55) {
    finalScore += 3;
    reasons.push("good-volatility");
  }

  if (momentum >= 75) {
    finalScore += 6;
    reasons.push("strong-momentum");
  } else if (momentum >= 60) {
    finalScore += 3;
    reasons.push("good-momentum");
  }

  if (trendScore >= 75) {
    finalScore += 6;
    reasons.push("strong-trend");
  } else if (trendScore >= 55) {
    finalScore += 3;
    reasons.push("good-trend");
  }

  if (movePercent >= 3) {
    finalScore += 5;
    reasons.push("strong-move");
  } else if (movePercent >= 1.5) {
    finalScore += 2;
    reasons.push("valid-move");
  }

  if (crypto) {
    finalScore += 5;
    reasons.push("crypto-24-7");
  }

  if (sessionBoost > 0) {
    finalScore += sessionBoost;
    reasons.push("session-boost");
  }

  if (isEntryStillValid(signal, mover)) {
    finalScore += 8;
    reasons.push("entry-valid");
  }

  return {
    finalScore,
    rankingReasons: reasons,
  };
}

function isQualitySignal(
  signal: TradeSignalForDb,
  mover?: Mover,
  scoreThreshold = 75
) {
  if (!signal.tradePlan) return false;
  if (!signal.primaryAsset) return false;
  if (!mover) return false;

  const crypto = isCryptoAsset(signal.primaryAsset);

  const confidence = String(signal.confidence || "").toLowerCase();
  const bias = String(signal.bias || mover.bias || "").toLowerCase();
  const trend = String(signal.trend || mover.trend || "").toLowerCase();

  const volatility = Number(signal.volatilityScore || mover.volatilityScore || 0);
  const momentum = Number(signal.momentumScore || mover.momentumScore || 0);
  const trendScore = Number(signal.trendScore || mover.trendScore || 0);
  const movePercent = Math.abs(
    Number(signal.priceChangePercent || mover.percentageMove || 0)
  );

  const ranked = calculateFinalScore(signal, mover);
  const score = ranked.finalScore;

  const confidencePass = crypto
    ? confidence === "high" || confidence === "medium" || confidence === ""
    : confidence === "high";

  const movePass = crypto ? movePercent >= 1 : movePercent >= 2;
  const volatilityPass = crypto ? volatility >= 45 : volatility >= 55;
  const trendPass = trend !== "flat";
  const trendOrMomentumPass = crypto
    ? trendScore >= 45 || momentum >= 60
    : trendScore >= 55 || momentum >= 70;

  return (
    confidencePass &&
    (bias === "bullish" || bias === "bearish") &&
    trendPass &&
    movePass &&
    score >= scoreThreshold &&
    volatilityPass &&
    trendOrMomentumPass &&
    isEntryStillValid(signal, mover)
  );
}

async function getRecentActiveSignals() {
  const since = new Date(
    Date.now() - ASSET_COOLDOWN_MINUTES * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("signal_results")
    .select("asset, status, created_at")
    .gte("created_at", since)
    .in("status", ["waiting", "open"]);

  if (error) {
    console.error("RECENT SIGNAL FETCH ERROR:", error);
    return [];
  }

  return (data || []) as ExistingSignal[];
}

function isAssetOnCooldown(
  signal: TradeSignalForDb,
  recentSignals: ExistingSignal[]
) {
  const asset = normalizeAsset(signal.primaryAsset);

  return recentSignals.some(
    (existing) => normalizeAsset(existing.asset) === asset
  );
}

export async function GET() {
  try {
    console.log("STEP 1: start");

    const session = getCurrentSession();

    const movers = (await getTopMovers(10)) as Mover[];
    console.log("STEP 2: movers", movers.length);
    console.log("STEP 3: session", session);

    const rawSignals = (await getTopMoverSignals(10)) as TradeSignalForDb[];
    console.log("STEP 4: raw signals", rawSignals.length);

    const recentSignals = await getRecentActiveSignals();
    console.log("STEP 5: recent active signals", recentSignals.length);

    const rankedSignals = rawSignals
      .map((signal) => {
        const mover = findMoverForSignal(signal, movers);
        const ranking = calculateFinalScore(signal, mover);

        return {
          ...signal,
          finalScore: Number(ranking.finalScore.toFixed(2)),
          rankingReasons: ranking.rankingReasons,
        } as RankedSignal;
      })
      .filter((signal) => {
        const mover = findMoverForSignal(signal, movers);
        const scoreThreshold = getScoreThreshold(signal.primaryAsset);

        if (!isQualitySignal(signal, mover, scoreThreshold)) return false;
        if (isAssetOnCooldown(signal, recentSignals)) return false;

        return true;
      })
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, MAX_NEW_SIGNALS);

    console.log("STEP 6: ranked quality signals", rankedSignals.length);

    const rows = rankedSignals.flatMap((signal) => {
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
          asset_class: isCryptoAsset(signal.primaryAsset)
            ? "crypto"
            : "standard",
        },
      ];
    });

    console.log("STEP 7: rows", rows.length);

    if (rows.length > 0) {
      const { error } = await supabase.from("signal_results").upsert(rows, {
        onConflict: "asset,direction,entry_price,stop_loss",
      });

      if (error) {
        console.error("UPSERT ERROR:", error);
      } else {
        console.log("STEP 8: upsert success");
      }
    }

    console.log("STEP 9: updating statuses...");
    await updateSignalStatuses(movers);

    console.log("STEP 10: DONE");

    return NextResponse.json({
      ok: true,
      session,
      maxNewSignals: MAX_NEW_SIGNALS,
      assetCooldownMinutes: ASSET_COOLDOWN_MINUTES,
      recentActiveSignals: recentSignals.length,
      movers,
      signals: rankedSignals,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("MARKET API ERROR:", error);

    return NextResponse.json({ error: "Market API failed" }, { status: 500 });
  }
}