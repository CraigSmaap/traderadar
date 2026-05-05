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

type StrategyProfile = {
  name: string;
  scoreThreshold: number;
  minMovePercent: number;
  minVolatility: number;
  minMomentum: number;
  minTrendScore: number;
  minRiskReward: number;
  requireHighConfidence: boolean;
  requireConfirmedEntry: boolean;
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

function getStrategyProfile(asset?: string): StrategyProfile {
  const normalizedAsset = normalizeAsset(asset);

  if (normalizedAsset === "BTCUSD" || normalizedAsset === "ETHUSD") {
    return {
      name: "crypto-momentum",
      scoreThreshold: 70,
      minMovePercent: 1.1,
      minVolatility: 55,
      minMomentum: 60,
      minTrendScore: 55,
      minRiskReward: 1.2,
      requireHighConfidence: false,
      requireConfirmedEntry: true,
    };
  }

  if (normalizedAsset === "XAUUSD") {
    return {
      name: "gold-confirmation",
      scoreThreshold: 74,
      minMovePercent: 0.55,
      minVolatility: 65,
      minMomentum: 65,
      minTrendScore: 65,
      minRiskReward: 1.25,
      requireHighConfidence: true,
      requireConfirmedEntry: true,
    };
  }

  if (normalizedAsset === "USOIL" || normalizedAsset === "BRENT") {
    return {
      name: "oil-volatility",
      scoreThreshold: 72,
      minMovePercent: 0.8,
      minVolatility: 70,
      minMomentum: 60,
      minTrendScore: 60,
      minRiskReward: 1.2,
      requireHighConfidence: false,
      requireConfirmedEntry: true,
    };
  }

  if (normalizedAsset === "NAS100" || normalizedAsset === "SPX500") {
    return {
      name: "index-trend",
      scoreThreshold: 72,
      minMovePercent: 0.45,
      minVolatility: 60,
      minMomentum: 65,
      minTrendScore: 65,
      minRiskReward: 1.2,
      requireHighConfidence: false,
      requireConfirmedEntry: true,
    };
  }

  return {
    name: "forex-clean-trend",
    scoreThreshold: 70,
    minMovePercent: 0.35,
    minVolatility: 55,
    minMomentum: 60,
    minTrendScore: 65,
    minRiskReward: 1.15,
    requireHighConfidence: false,
    requireConfirmedEntry: true,
  };
}

function getTradeDirection(signal: TradeSignalForDb) {
  return signal.tradePlan?.direction;
}

function isBiasAligned(signal: TradeSignalForDb, mover?: Mover) {
  const direction = getTradeDirection(signal);
  const bias = String(signal.bias || mover?.bias || "").toLowerCase();
  const trend = String(signal.trend || mover?.trend || "").toLowerCase();

  if (direction === "BUY") {
    return bias === "bullish" && trend !== "bearish" && trend !== "flat";
  }

  if (direction === "SELL") {
    return bias === "bearish" && trend !== "bullish" && trend !== "flat";
  }

  return false;
}

function isConfirmedEntry(signal: TradeSignalForDb, mover: Mover) {
  const direction = getTradeDirection(signal);
  const currentPrice = Number(mover.price || 0);
  const entryPrice = Number(signal.tradePlan?.entryPrice || 0);
  const entryZoneLow = Number(signal.tradePlan?.entryZoneLow || 0);
  const entryZoneHigh = Number(signal.tradePlan?.entryZoneHigh || 0);

  if (!direction || !currentPrice || !entryPrice) return false;

  if (direction === "BUY") {
    if (entryZoneHigh > 0) {
      return currentPrice >= entryZoneHigh;
    }

    return currentPrice >= entryPrice;
  }

  if (direction === "SELL") {
    if (entryZoneLow > 0) {
      return currentPrice <= entryZoneLow;
    }

    return currentPrice <= entryPrice;
  }

  return false;
}

function hasValidRiskReward(
  signal: TradeSignalForDb,
  minRiskReward: number
) {
  const direction = getTradeDirection(signal);
  const entry = Number(signal.tradePlan?.entryPrice || 0);
  const stopLoss = Number(signal.tradePlan?.stopLoss || 0);
  const tp1 = Number(signal.tradePlan?.takeProfits?.[0]?.price || 0);

  if (!direction || !entry || !stopLoss || !tp1) return false;

  const risk = direction === "BUY" ? entry - stopLoss : stopLoss - entry;
  const reward = direction === "BUY" ? tp1 - entry : entry - tp1;

  if (risk <= 0 || reward <= 0) return false;

  return reward / risk >= minRiskReward;
}

export function calculateFinalScore(signal: TradeSignalForDb, mover?: Mover) {
  const reasons: string[] = [];

  const profile = getStrategyProfile(signal.primaryAsset);
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

  reasons.push(profile.name);

  if (confidence === "high") {
    finalScore += 10;
    reasons.push("high-confidence");
  }

  if (confidence === "medium") {
    finalScore += crypto ? 3 : 2;
    reasons.push("medium-confidence");
  }

  if (volatility >= profile.minVolatility + 15) {
    finalScore += 8;
    reasons.push("strong-volatility");
  } else if (volatility >= profile.minVolatility) {
    finalScore += 4;
    reasons.push("valid-volatility");
  }

  if (momentum >= profile.minMomentum + 15) {
    finalScore += 8;
    reasons.push("strong-momentum");
  } else if (momentum >= profile.minMomentum) {
    finalScore += 4;
    reasons.push("valid-momentum");
  }

  if (trendScore >= profile.minTrendScore + 15) {
    finalScore += 8;
    reasons.push("strong-trend");
  } else if (trendScore >= profile.minTrendScore) {
    finalScore += 4;
    reasons.push("valid-trend");
  }

  if (movePercent >= profile.minMovePercent * 2) {
    finalScore += 6;
    reasons.push("strong-move");
  } else if (movePercent >= profile.minMovePercent) {
    finalScore += 3;
    reasons.push("valid-move");
  }

  if (sessionBoost > 0) {
    finalScore += sessionBoost;
    reasons.push("session-boost");
  }

  if (mover && isConfirmedEntry(signal, mover)) {
    finalScore += 10;
    reasons.push("confirmed-entry");
  }

  if (mover && isEntryStillValid(signal, mover)) {
    finalScore += 4;
    reasons.push("entry-valid");
  }

  if (hasValidRiskReward(signal, profile.minRiskReward)) {
    finalScore += 5;
    reasons.push("valid-risk-reward");
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

  const profile = getStrategyProfile(signal.primaryAsset);
  const confidence = String(signal.confidence || "").toLowerCase();

  const volatility = Number(signal.volatilityScore || mover.volatilityScore || 0);
  const momentum = Number(signal.momentumScore || mover.momentumScore || 0);
  const trendScore = Number(signal.trendScore || mover.trendScore || 0);
  const movePercent = Math.abs(
    Number(signal.priceChangePercent || mover.percentageMove || 0)
  );

  const ranked = calculateFinalScore(signal, mover);
  const score = ranked.finalScore;

  const effectiveThreshold = Math.max(scoreThreshold, profile.scoreThreshold);

  const confidencePass = profile.requireHighConfidence
    ? confidence === "high"
    : confidence === "high" || confidence === "medium";

  const confirmedEntryPass = profile.requireConfirmedEntry
    ? isConfirmedEntry(signal, mover)
    : true;

  return (
    confidencePass &&
    isBiasAligned(signal, mover) &&
    movePercent >= profile.minMovePercent &&
    volatility >= profile.minVolatility &&
    momentum >= profile.minMomentum &&
    trendScore >= profile.minTrendScore &&
    score >= effectiveThreshold &&
    confirmedEntryPass &&
    hasValidRiskReward(signal, profile.minRiskReward) &&
    isEntryStillValid(signal, mover)
  );
}