export type MarketTrend = "UP" | "DOWN" | "FLAT";

export type VolatilityState = "LOW" | "MEDIUM" | "HIGH";

export type TechnicalOpportunity =
  | "BREAKOUT"
  | "BREAKDOWN"
  | "TRENDING"
  | "RANGING"
  | "NONE";

export type MarketSnapshot = {
  symbol: string;
  providerSymbol: string;
  lastPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number | null;
  dayLow: number | null;
  trend: MarketTrend;
  volatility: VolatilityState;
  opportunity: TechnicalOpportunity;
  candlesAnalyzed: number;
  asOf: number;
};

type YahooChartMeta = {
  symbol?: string;
  regularMarketPrice?: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
};

type YahooChartQuote = {
  close?: Array<number | null>;
  high?: Array<number | null>;
  low?: Array<number | null>;
};

type YahooChartResult = {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: YahooChartQuote[];
  };
};

export const MARKET_SYMBOL_MAP: Record<string, string[]> = {
  J200: ["^J200.JO"],
  NPN: ["NPN.JO"],
  PRX: ["PRX.JO"],
  AGL: ["AGL.JO"],
  BHG: ["BHG.JO"],
  GFI: ["GFI.JO"],
  HAR: ["HAR.JO"],
  SOL: ["SOL.JO"],
  MTN: ["MTN.JO"],
  VOD: ["VOD.JO"],
  SHP: ["SHP.JO"],
  FSR: ["FSR.JO"],
  SBK: ["SBK.JO"],
  ABG: ["ABG.JO"],
  NED: ["NED.JO"],

  XAUUSD: ["GC=F", "XAUUSD=X"],
  USDZAR: ["USDZAR=X", "ZAR=X"],

  EURUSD: ["EURUSD=X"],
  GBPUSD: ["GBPUSD=X"],
  SPX: ["^GSPC"],
  NASDAQ: ["^NDX"],
  OIL: ["CL=F"],
};

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getNumericSeries(values?: Array<number | null>) {
  return (values || []).filter(isNumber);
}

function safeRound(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function getTrendFromCloses(closes: number[]): MarketTrend {
  if (closes.length < 5) {
    return "FLAT";
  }

  const recent = closes.slice(-5);
  const first = recent[0];
  const last = recent[recent.length - 1];

  if (!isNumber(first) || !isNumber(last) || first === 0) {
    return "FLAT";
  }

  const movePct = ((last - first) / first) * 100;

  if (movePct >= 0.5) return "UP";
  if (movePct <= -0.5) return "DOWN";
  return "FLAT";
}

function getVolatilityState(
  lastPrice: number,
  dayHigh: number | null,
  dayLow: number | null
): VolatilityState {
  if (!isNumber(lastPrice) || lastPrice <= 0 || dayHigh === null || dayLow === null) {
    return "LOW";
  }

  const intradayRangePct = ((dayHigh - dayLow) / lastPrice) * 100;

  if (intradayRangePct >= 3) return "HIGH";
  if (intradayRangePct >= 1.2) return "MEDIUM";
  return "LOW";
}

function getTechnicalOpportunity(params: {
  trend: MarketTrend;
  changePercent: number;
  volatility: VolatilityState;
  lastPrice: number;
  dayHigh: number | null;
  dayLow: number | null;
}): TechnicalOpportunity {
  const { trend, changePercent, volatility, lastPrice, dayHigh, dayLow } = params;

  const nearHigh =
    dayHigh !== null && dayHigh > 0 && Math.abs(dayHigh - lastPrice) / dayHigh <= 0.0035;

  const nearLow =
    dayLow !== null && dayLow > 0 && Math.abs(lastPrice - dayLow) / dayLow <= 0.0035;

  if (trend === "UP" && changePercent >= 1 && volatility !== "LOW" && nearHigh) {
    return "BREAKOUT";
  }

  if (trend === "DOWN" && changePercent <= -1 && volatility !== "LOW" && nearLow) {
    return "BREAKDOWN";
  }

  if (trend === "UP" || trend === "DOWN") {
    return "TRENDING";
  }

  if (volatility !== "LOW") {
    return "RANGING";
  }

  return "NONE";
}

export function getProviderSymbols(symbol: string) {
  return MARKET_SYMBOL_MAP[symbol] || [symbol];
}

export function getPrimaryProviderSymbol(symbol: string) {
  return getProviderSymbols(symbol)[0];
}

export function buildEmptySnapshot(symbol: string): MarketSnapshot {
  return {
    symbol,
    providerSymbol: getPrimaryProviderSymbol(symbol),
    lastPrice: 0,
    previousClose: 0,
    change: 0,
    changePercent: 0,
    dayHigh: null,
    dayLow: null,
    trend: "FLAT",
    volatility: "LOW",
    opportunity: "NONE",
    candlesAnalyzed: 0,
    asOf: Date.now(),
  };
}

export function buildSnapshotFromYahooChart(params: {
  appSymbol: string;
  providerSymbol: string;
  result?: YahooChartResult;
}): MarketSnapshot {
  const { appSymbol, providerSymbol, result } = params;

  if (!result) {
    return buildEmptySnapshot(appSymbol);
  }

  const meta = result.meta || {};
  const quote = result.indicators?.quote?.[0];

  const closes = getNumericSeries(quote?.close);
  const highs = getNumericSeries(quote?.high);
  const lows = getNumericSeries(quote?.low);

  const lastCloseFromSeries = closes.length > 0 ? closes[closes.length - 1] : null;
  const lastPrice = isNumber(meta.regularMarketPrice)
    ? meta.regularMarketPrice
    : isNumber(lastCloseFromSeries)
    ? lastCloseFromSeries
    : 0;

  const previousClose = isNumber(meta.previousClose)
    ? meta.previousClose
    : isNumber(meta.chartPreviousClose)
    ? meta.chartPreviousClose
    : 0;

  const change = lastPrice - previousClose;
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

  const dayHigh =
    isNumber(meta.regularMarketDayHigh)
      ? meta.regularMarketDayHigh
      : highs.length > 0
      ? Math.max(...highs)
      : null;

  const dayLow =
    isNumber(meta.regularMarketDayLow)
      ? meta.regularMarketDayLow
      : lows.length > 0
      ? Math.min(...lows)
      : null;

  const trend = getTrendFromCloses(closes);
  const volatility = getVolatilityState(lastPrice, dayHigh, dayLow);
  const opportunity = getTechnicalOpportunity({
    trend,
    changePercent,
    volatility,
    lastPrice,
    dayHigh,
    dayLow,
  });

  return {
    symbol: appSymbol,
    providerSymbol,
    lastPrice: safeRound(lastPrice, 4),
    previousClose: safeRound(previousClose, 4),
    change: safeRound(change, 4),
    changePercent: safeRound(changePercent, 2),
    dayHigh: dayHigh === null ? null : safeRound(dayHigh, 4),
    dayLow: dayLow === null ? null : safeRound(dayLow, 4),
    trend,
    volatility,
    opportunity,
    candlesAnalyzed: closes.length,
    asOf: Date.now(),
  };
}