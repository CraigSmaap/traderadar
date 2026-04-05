export type SignalBias = "Bullish" | "Bearish" | "Risk-Off";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type SignalSourceType = "manual" | "news-api" | "ai-draft";

export type TradeSignalStatus = "draft" | "published";

export type TradeSignal = {
  id: string;
  category: string;
  event: string;
  impact: string;
  saImpact: string;
  assets: string[];
  bias: SignalBias;
  confidence: ConfidenceLevel;
  tradeUrl: string;
  timestamp: number;
  source: SignalSourceType;
  region: string;
  status: TradeSignalStatus;
};