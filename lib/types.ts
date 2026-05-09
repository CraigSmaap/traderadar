export const EXNESS_ALLOWED_ASSETS = [
  // Existing
  "BTCUSD",
  "ETHUSD",
  "NAS100",
  "SPX500",
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "USOIL",
  "BRENT",
  // ZAR pairs
  "USDZAR",
  "EURZAR",
  "GBPZAR",
  // Forex majors/crosses
  "AUDUSD",
  "USDCAD",
  "USDCHF",
  "EURGBP",
  "EURJPY",
  "GBPJPY",
  // Crypto
  "XRPUSD",
  "SOLUSD",
  // Commodities
  "XAGUSD",
  // Indices
  "DE40",
  "UK100",
] as const;

export type ExnessAsset = (typeof EXNESS_ALLOWED_ASSETS)[number];

export function isExnessAllowedAsset(symbol: string): symbol is ExnessAsset {
  return EXNESS_ALLOWED_ASSETS.includes(symbol as ExnessAsset);
}

export type SignalBias = "Bullish" | "Bearish" | "Risk-Off" | "Neutral";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type SignalSourceType = "manual" | "news-api" | "ai-draft" | "system";

export type TradeSignalStatus = "draft" | "published" | "archived";

export type TradeCall = "LONG" | "SHORT" | "DEFENSIVE" | "WATCH";

export type SetupStrength = "Weak" | "Moderate" | "Strong";

export type AssetClass =
  | "forex"
  | "crypto"
  | "indices"
  | "commodities"
  | "stocks"
  | "synthetic"
  | "unknown";

export type TradeDirection = "BUY" | "SELL" | "WATCH";

export type TradePlanStatus =
  | "valid"
  | "waiting-confirmation"
  | "invalidated"
  | "expired";

export type TakeProfitTarget = {
  label: "TP1" | "TP2" | "TP3";
  price: number;
  note?: string;
};

export type RiskProfile = "conservative" | "balanced" | "aggressive";

export type TradePlan = {
  direction: TradeDirection;

  entryPrice?: number;
  entryZoneLow?: number;
  entryZoneHigh?: number;

  stopLoss?: number;
  takeProfits?: TakeProfitTarget[];

  riskReward?: number;
  riskProfile: RiskProfile;

  planStatus: TradePlanStatus;
  invalidationReason?: string;

  setupReason: string;
  confirmationTrigger?: string;
};

export type LotSizeInput = {
  accountBalance: number;
  riskPercent: number;
  entryPrice: number;
  stopLoss: number;
  pipValuePerLot?: number;
};

export type LotSizeResult = {
  riskAmount: number;
  stopDistance: number;
  suggestedLotSize: number;
};

export type TradeSignal = {
  id: string;

  category: string;
  event: string;
  impact: string;
  saImpact: string;

  assets: string[];
  primaryAsset?: string;
  assetClass?: AssetClass;
  bias: SignalBias;
  confidence: ConfidenceLevel;

  tradeUrl: string;
  tradePlan?: TradePlan;

  percentageMove?: number;
  volumeChange?: number;
  volatilityScore?: number;
  momentumScore?: number;
  radarScore?: number;
  fibNearLevel?: string | null;
  candlePattern?: string | null;
  candlePatternBias?: string | null;

  timestamp: number;

  source: SignalSourceType;
  region: string;
  status: TradeSignalStatus;

  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;

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