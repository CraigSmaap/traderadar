import type {
  ConfidenceLevel,
  SetupStrength,
  SignalBias,
  TradeSignal,
} from "@/lib/types";
import type {
  MarketSnapshot,
  MarketTrend,
  TechnicalOpportunity,
  VolatilityState,
} from "@/lib/market";

export type TechnicalState =
  | "BULLISH_TREND"
  | "BEARISH_TREND"
  | "RISK_OFF_DEFENSIVE"
  | "BREAKOUT"
  | "BREAKDOWN"
  | "TRENDING_UP"
  | "TRENDING_DOWN"
  | "RANGING"
  | "NEUTRAL"
  | "UNCONFIRMED";

export type TechnicalScoreResult = {
  state: TechnicalState;
  score: number;
  reason: string;
};

export function getConfidenceWeight(confidence: ConfidenceLevel) {
  if (confidence === "High") return 3;
  if (confidence === "Medium") return 2;
  return 1;
}

export function getRecencyWeight(timestamp: number, now: number) {
  const ageMs = now - timestamp;
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours <= 6) return 3;
  if (ageHours <= 24) return 2;
  if (ageHours <= 72) return 1;
  return 0;
}

export function deriveSetupStrengthFromTotal(totalScore: number): SetupStrength {
  if (totalScore >= 30) return "Strong";
  if (totalScore >= 18) return "Moderate";
  return "Weak";
}

export function getLatestBias(signals: TradeSignal[]): SignalBias | "Neutral" {
  if (signals.length === 0) {
    return "Neutral";
  }

  return signals[0].bias;
}

export function getStrongestConfidence(
  signals: TradeSignal[]
): ConfidenceLevel | "Low" {
  const hasHigh = signals.some((signal) => signal.confidence === "High");
  if (hasHigh) {
    return "High";
  }

  const hasMedium = signals.some((signal) => signal.confidence === "Medium");
  if (hasMedium) {
    return "Medium";
  }

  return "Low";
}

export function getSignalScore(signals: TradeSignal[]) {
  const raw = signals.reduce((total, signal) => {
    return total + getConfidenceWeight(signal.confidence);
  }, 0);

  return Math.min(raw, 30);
}

export function getRecencyScore(signals: TradeSignal[], now: number) {
  const raw = signals.reduce((total, signal) => {
    return total + getRecencyWeight(signal.timestamp, now);
  }, 0);

  return Math.min(raw, 15);
}

export function getNewsScore(signals: TradeSignal[], now: number) {
  const newsSignals = signals.filter((signal) => signal.source === "news-api");

  if (newsSignals.length === 0) {
    return 0;
  }

  const rawNewsScore = newsSignals.reduce((total, signal) => {
    return (
      total +
      getConfidenceWeight(signal.confidence) +
      getRecencyWeight(signal.timestamp, now)
    );
  }, 0);

  return Math.min(rawNewsScore, 15);
}

export function getBehaviorScore(
  tradeClickCount: number,
  chartClickCount: number
) {
  const weighted = tradeClickCount * 2 + chartClickCount;
  return Math.min(weighted, 10);
}

function hasActiveSnapshot(
  snapshot?: MarketSnapshot | null
): snapshot is MarketSnapshot {
  return !!snapshot && snapshot.lastPrice > 0;
}

function getMoveStrength(changePercent: number) {
  const absMove = Math.abs(changePercent);

  if (absMove >= 8) return 14;
  if (absMove >= 5) return 12;
  if (absMove >= 3) return 10;
  if (absMove >= 2) return 8;
  if (absMove >= 1) return 6;
  if (absMove >= 0.5) return 3;
  return 0;
}

function getTrendStrength(trend: MarketTrend) {
  if (trend === "UP" || trend === "DOWN") return 8;
  return 0;
}

function getVolatilityStrength(volatility: VolatilityState) {
  if (volatility === "HIGH") return 8;
  if (volatility === "MEDIUM") return 4;
  return 0;
}

function getOpportunityStrength(opportunity: TechnicalOpportunity) {
  if (opportunity === "BREAKOUT" || opportunity === "BREAKDOWN") return 16;
  if (opportunity === "TRENDING") return 10;
  if (opportunity === "RANGING") return 5;
  return 0;
}

function getBiasAlignmentBonus(params: {
  latestBias: SignalBias | "Neutral";
  marketTrend: MarketTrend;
  opportunity: TechnicalOpportunity;
}) {
  const { latestBias, marketTrend, opportunity } = params;

  if (
    latestBias === "Bullish" &&
    (marketTrend === "UP" || opportunity === "BREAKOUT")
  ) {
    return 5;
  }

  if (
    latestBias === "Bearish" &&
    (marketTrend === "DOWN" || opportunity === "BREAKDOWN")
  ) {
    return 5;
  }

  if (latestBias === "Risk-Off" && marketTrend === "DOWN") {
    return 4;
  }

  return 0;
}

export function getTechnicalScore(params: {
  latestBias: SignalBias | "Neutral";
  strongestConfidence: ConfidenceLevel | "Low";
  signalCount: number;
  recencyScore: number;
  marketSnapshot?: MarketSnapshot | null;
}): TechnicalScoreResult {
  const {
    latestBias,
    strongestConfidence,
    signalCount,
    recencyScore,
    marketSnapshot,
  } = params;

  const hasFreshSignals = recencyScore >= 2;
  const hasSignalSupport = signalCount >= 1;

  if (hasActiveSnapshot(marketSnapshot)) {
    const moveStrength = getMoveStrength(marketSnapshot.changePercent);
    const trendStrength = getTrendStrength(marketSnapshot.trend);
    const volatilityStrength = getVolatilityStrength(marketSnapshot.volatility);
    const opportunityStrength = getOpportunityStrength(
      marketSnapshot.opportunity
    );
    const biasAlignmentBonus = getBiasAlignmentBonus({
      latestBias,
      marketTrend: marketSnapshot.trend,
      opportunity: marketSnapshot.opportunity,
    });

    const confidenceBonus =
      strongestConfidence === "High"
        ? 4
        : strongestConfidence === "Medium"
        ? 2
        : 0;

    const signalSupportBonus = hasSignalSupport && hasFreshSignals ? 3 : 0;

    const rawScore =
      moveStrength +
      trendStrength +
      volatilityStrength +
      opportunityStrength +
      biasAlignmentBonus +
      confidenceBonus +
      signalSupportBonus;

    const score = Math.min(rawScore, 30);

    if (marketSnapshot.opportunity === "BREAKOUT") {
      return {
        state: "BREAKOUT",
        score,
        reason:
          "Price is showing breakout conditions with strong movement and elevated volatility.",
      };
    }

    if (marketSnapshot.opportunity === "BREAKDOWN") {
      return {
        state: "BREAKDOWN",
        score,
        reason:
          "Price is showing breakdown conditions with strong downside movement and elevated volatility.",
      };
    }

    if (marketSnapshot.trend === "UP" && score > 0) {
      return {
        state: "TRENDING_UP",
        score,
        reason:
          "Market structure is actively trending upward and creating tradable momentum.",
      };
    }

    if (marketSnapshot.trend === "DOWN" && score > 0) {
      return {
        state: "TRENDING_DOWN",
        score,
        reason:
          "Market structure is actively trending downward and creating tradable momentum.",
      };
    }

    if (marketSnapshot.opportunity === "RANGING" && score > 0) {
      return {
        state: "RANGING",
        score,
        reason:
          "Market is active enough to trade, but price is rotating rather than cleanly breaking.",
      };
    }

    if (score > 0) {
      return {
        state: "UNCONFIRMED",
        score,
        reason:
          "Market movement is present, but directional conviction is still limited.",
      };
    }
  }

  if (
    latestBias === "Bullish" &&
    strongestConfidence === "High" &&
    signalCount >= 2 &&
    recencyScore >= 2
  ) {
    return {
      state: "BULLISH_TREND",
      score: 18,
      reason:
        "Bullish bias is aligned with strong confidence and fresh signal support.",
    };
  }

  if (
    latestBias === "Bearish" &&
    strongestConfidence === "High" &&
    signalCount >= 2 &&
    recencyScore >= 2
  ) {
    return {
      state: "BEARISH_TREND",
      score: 18,
      reason:
        "Bearish bias is aligned with strong confidence and fresh signal support.",
    };
  }

  if (
    latestBias === "Risk-Off" &&
    signalCount >= 1 &&
    strongestConfidence !== "Low"
  ) {
    return {
      state: "RISK_OFF_DEFENSIVE",
      score: 12,
      reason: "Risk-off tone supports defensive technical posture.",
    };
  }

  if (latestBias !== "Neutral" && signalCount >= 1) {
    return {
      state: "UNCONFIRMED",
      score: 6,
      reason:
        "Directional bias exists, but technical confirmation is still incomplete.",
    };
  }

  return {
    state: "NEUTRAL",
    score: 0,
    reason: "No meaningful technical confirmation is available yet.",
  };
}

export function clampEdgeScore(value: number) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}