import { isEntryStillValid } from "@/lib/execution";
import {
  getScoreThreshold,
  getSessionBoostValue,
  isCryptoAsset,
  normalizeAsset,
} from "@/lib/marketContext";

export type TradePlan = {
  direction: "BUY" | "SELL";
  entryPrice: number;
  entryZoneLow?: number;
  entryZoneHigh?: number;
  stopLoss: number;
  takeProfits?: { label: string; price: number }[];
};

export type TradeSignalForDb = {
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

export type Mover = {
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

export type RankedSignal = TradeSignalForDb & {
  finalScore: number;
  rankingReasons: string[];
};

export { getScoreThreshold, isCryptoAsset, normalizeAsset };

export function findMoverForSignal(signal: TradeSignalForDb, movers: Mover[]) {
  const asset = normalizeAsset(signal.primaryAsset);

  return movers.find((mover) => normalizeAsset(mover.symbol) === asset);
}

export function getSignalBaseScore(signal: TradeSignalForDb, mover?: Mover) {
  const signalRadar = Number(signal.radarScore || 0);
  const moverRadar = Number(mover?.radarScore || 0);

  return Math.max(signalRadar, moverRadar);
}

export function calculateFinalScore(signal: TradeSignalForDb, mover?: Mover) {
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

  if (confidence === "medium") {
    finalScore += crypto ? 4 : 3;
    reasons.push("medium-confidence");
  }

  if (volatility >= 75) {
    finalScore += 6;
    reasons.push("strong-volatility");
  } else if (volatility >= 60) {
    finalScore += 3;
    reasons.push("good-volatility");
  } else if (volatility >= 18 && crypto) {
    finalScore += 2;
    reasons.push("developing-crypto-volatility");
  }

  if (momentum >= 75) {
    finalScore += 6;
    reasons.push("strong-momentum");
  } else if (momentum >= 65) {
    finalScore += 3;
    reasons.push("good-momentum");
  } else if (momentum >= 25 && crypto) {
    finalScore += 2;
    reasons.push("developing-crypto-momentum");
  }

  if (trendScore >= 75) {
    finalScore += 6;
    reasons.push("strong-trend");
  } else if (trendScore >= 60) {
    finalScore += 3;
    reasons.push("good-trend");
  } else if (trendScore >= 55) {
    finalScore += 2;
    reasons.push("developing-trend");
  }

  if (movePercent >= 3) {
    finalScore += 5;
    reasons.push("strong-move");
  } else if (movePercent >= 1.2) {
    finalScore += 3;
    reasons.push("valid-move");
  } else if (movePercent >= 0.8 && crypto) {
    finalScore += 2;
    reasons.push("developing-crypto-move");
  }

  if (crypto && movePercent >= 0.8) {
    finalScore += 2;
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

export function isQualitySignal(
  signal: TradeSignalForDb,
  mover?: Mover,
  scoreThreshold = 45
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

const effectiveThreshold = crypto ? 45 : Math.min(scoreThreshold, 50);

// 🔥 REMOVE confidence as a blocker completely
const confidencePass = true;

const movePass = crypto ? movePercent >= 0.8 : movePercent >= 0.8;

const volatilityPass = crypto ? volatility >= 18 : volatility >= 15;

const trendPass = trend !== "flat";

const trendOrMomentumPass = crypto
  ? trendScore >= 55 || momentum >= 25
  : trendScore >= 55 || momentum >= 20;

return (
  confidencePass &&
  (bias === "bullish" || bias === "bearish") &&
  trendPass &&
  movePass &&
  score >= effectiveThreshold &&
  volatilityPass &&
  trendOrMomentumPass &&
  isEntryStillValid(signal, mover)
);
}