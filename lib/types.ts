export type SignalBias = "Bullish" | "Bearish" | "Risk-Off";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type SignalSourceType = "manual" | "news-api" | "ai-draft";

export type TradeSignalStatus = "draft" | "published";

export type TradeCall = "LONG" | "SHORT" | "DEFENSIVE" | "WATCH";

export type SetupStrength = "Weak" | "Moderate" | "Strong";

export type TradeSignal = {
  id: string;

  // Core content
  category: string;
  event: string;
  impact: string;
  saImpact: string;

  // Market targeting
  assets: string[];
  bias: SignalBias;
  confidence: ConfidenceLevel;

  // Execution
  tradeUrl: string;

  // Time (CURRENT SYSTEM - DO NOT REMOVE)
  timestamp: number;

  // Metadata
  source: SignalSourceType;
  region: string;
  status: TradeSignalStatus;

  // 🔒 FUTURE BACKEND FIELDS (OPTIONAL - SAFE)
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;

  // 🔒 FUTURE DEDUPE SYSTEM
  dedupeKey?: string;
};

export type EdgeScoreBreakdown = {
  signal: number;
  recency: number;
  news: number;
  technical: number;
  behavior: number;
  total: number;
};

export type LiveAsset = {
  id: string;
  name: string;
  symbol: string;
  market: string;
  focus: string;
  reason: string;
  chartUrl: string;
};

export type TradeClickType = "chart" | "trade";

export type TradeClick = {
  asset?: string;
  link?: string;
  type?: TradeClickType;
  time: string;
};

export type RankedAsset = LiveAsset & {
  edgeScore: EdgeScoreBreakdown;
  signalCount: number;
  clickCount: number;
  tradeClickCount: number;
  chartClickCount: number;
  latestBias: SignalBias | "Neutral";
  strongestConfidence: ConfidenceLevel | "Low";
  recommendation: string;
  tradeCall: TradeCall;
  setupStrength: SetupStrength;
};