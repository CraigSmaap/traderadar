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

  if (confidence === "medium" && crypto) {
    finalScore += 2;
    reasons.push("crypto-medium-confidence");
  }

  if (volatility >= 75) {
    finalScore += 6;
    reasons.push("strong-volatility");
  } else if (volatility >= 60) {
    finalScore += 3;
    reasons.push("good-volatility");
  }

  if (momentum >= 75) {
    finalScore += 6;
    reasons.push("strong-momentum");
  } else if (momentum >= 65) {
    finalScore += 3;
    reasons.push("good-momentum");
  }

  if (trendScore >= 75) {
    finalScore += 6;
    reasons.push("strong-trend");
  } else if (trendScore >= 60) {
    finalScore += 3;
    reasons.push("good-trend");
  }

  if (movePercent >= 3) {
    finalScore += 5;
    reasons.push("strong-move");
  } else if (movePercent >= 2) {
    finalScore += 2;
    reasons.push("valid-move");
  }

  if (crypto && movePercent >= 2) {
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
  scoreThreshold = 85
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

  const minimumScore = Math.max(scoreThreshold, 85);

  const confidencePass = crypto
    ? confidence === "high" || confidence === "medium"
    : confidence === "high";

  const movePass = crypto ? movePercent >= 2 : movePercent >= 2;
  const volatilityPass = crypto ? volatility >= 60 : volatility >= 60;
  const trendPass = trend !== "flat";
  const trendOrMomentumPass = crypto
    ? trendScore >= 60 || momentum >= 70
    : trendScore >= 60 || momentum >= 70;

  return (
    confidencePass &&
    (bias === "bullish" || bias === "bearish") &&
    trendPass &&
    movePass &&
    score >= minimumScore &&
    volatilityPass &&
    trendOrMomentumPass &&
    isEntryStillValid(signal, mover)
  );
}