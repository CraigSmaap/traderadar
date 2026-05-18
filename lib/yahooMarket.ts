// /lib/yahooMarket.ts

import type { AssetClass, SignalBias } from "./types";
import { isExnessAllowedAsset } from "./types";

export type MarketMover = {
  symbol: string;
  price: number;
  changePercent: number;
};

export type MarketSnapshot = {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  price: number;
  previousPrice: number;
  percentageMove: number;
  volumeChange: number;
  volatilityScore: number;
  momentumScore: number;
  trendScore: number;
  atr: number;
  radarScore: number;
  bias: SignalBias;
  trend: "UP" | "DOWN" | "FLAT";
  rsi: number;
  adx: number;
  plusDI: number;
  minusDI: number;
  ema50: number;
  swingLow: number;
  swingHigh: number;
  swingLowFibLevel: string | null;
  swingHighFibLevel: string | null;
  candlePattern: string | null;
  candlePatternBias: "bullish" | "bearish" | "neutral" | null;
  nearestSupport: number | null;
  nearestResistance: number | null;
};

const SYMBOLS = [
  // Crypto
  "BTC-USD",
  "ETH-USD",
  "XRP-USD",
  "SOL-USD",
  // Indices
  "^NDX",
  "^GSPC",
  "^GDAXI",
  "^FTSE",
  // Commodities
  "GC=F",
  "SI=F",
  "CL=F",
  "BZ=F",
  // Forex majors
  "EURUSD=X",
  "GBPUSD=X",
  "JPY=X",
  "AUDUSD=X",
  "USDCAD=X",
  "USDCHF=X",
  "EURGBP=X",
  "EURJPY=X",
  "GBPJPY=X",
  // ZAR pairs
  "USDZAR=X",
  "EURZAR=X",
  "GBPZAR=X",
] as const;

function mapSymbol(yahooSymbol: string): string | null {
  switch (yahooSymbol) {
    case "BTC-USD":   return "BTCUSD";
    case "ETH-USD":   return "ETHUSD";
    case "XRP-USD":   return "XRPUSD";
    case "SOL-USD":   return "SOLUSD";
    case "^NDX":      return "NAS100";
    case "^GSPC":     return "US500";
    case "^GDAXI":    return "DE40";
    case "^FTSE":     return "UK100";
    case "GC=F":      return "XAUUSD";
    case "SI=F":      return "XAGUSD";
    case "CL=F":      return "USOIL";
    case "BZ=F":      return "UKOIL";
    case "EURUSD=X":  return "EURUSD";
    case "GBPUSD=X":  return "GBPUSD";
    case "JPY=X":     return "USDJPY";
    case "AUDUSD=X":  return "AUDUSD";
    case "USDCAD=X":  return "USDCAD";
    case "USDCHF=X":  return "USDCHF";
    case "EURGBP=X":  return "EURGBP";
    case "EURJPY=X":  return "EURJPY";
    case "GBPJPY=X":  return "GBPJPY";
    case "USDZAR=X":  return "USDZAR";
    case "EURZAR=X":  return "EURZAR";
    case "GBPZAR=X":  return "GBPZAR";
    default:          return null;
  }
}

function getAssetMeta(symbol: string): {
  id: string;
  name: string;
  assetClass: AssetClass;
} {
  switch (symbol) {
    case "BTCUSD":  return { id: "btc",    name: "Bitcoin",                           assetClass: "crypto" };
    case "ETHUSD":  return { id: "eth",    name: "Ethereum",                          assetClass: "crypto" };
    case "XRPUSD":  return { id: "xrp",    name: "Ripple",                            assetClass: "crypto" };
    case "SOLUSD":  return { id: "sol",    name: "Solana",                            assetClass: "crypto" };
    case "NAS100":  return { id: "nasdaq", name: "Nasdaq 100",                        assetClass: "indices" };
    case "US500":   return { id: "us500",  name: "S&P 500 (US500)",                  assetClass: "indices" };
    case "SPX500":  return { id: "spx",    name: "S&P 500",                           assetClass: "indices" };
    case "DE40":    return { id: "de40",   name: "Germany 40 (DAX)",                  assetClass: "indices" };
    case "UK100":   return { id: "uk100",  name: "UK 100 (FTSE)",                     assetClass: "indices" };
    case "XAUUSD":  return { id: "xauusd", name: "Gold",                              assetClass: "commodities" };
    case "XAGUSD":  return { id: "xagusd", name: "Silver",                            assetClass: "commodities" };
    case "USOIL":   return { id: "usoil",  name: "US Crude Oil",                      assetClass: "commodities" };
    case "UKOIL":   return { id: "brent",  name: "Brent Crude Oil",                   assetClass: "commodities" };
    case "EURUSD":  return { id: "eurusd", name: "Euro / US Dollar",                  assetClass: "forex" };
    case "GBPUSD":  return { id: "gbpusd", name: "British Pound / US Dollar",         assetClass: "forex" };
    case "USDJPY":  return { id: "usdjpy", name: "US Dollar / Japanese Yen",          assetClass: "forex" };
    case "AUDUSD":  return { id: "audusd", name: "Australian Dollar / US Dollar",     assetClass: "forex" };
    case "USDCAD":  return { id: "usdcad", name: "US Dollar / Canadian Dollar",       assetClass: "forex" };
    case "USDCHF":  return { id: "usdchf", name: "US Dollar / Swiss Franc",           assetClass: "forex" };
    case "EURGBP":  return { id: "eurgbp", name: "Euro / British Pound",              assetClass: "forex" };
    case "EURJPY":  return { id: "eurjpy", name: "Euro / Japanese Yen",               assetClass: "forex" };
    case "GBPJPY":  return { id: "gbpjpy", name: "British Pound / Japanese Yen",      assetClass: "forex" };
    case "USDZAR":  return { id: "usdzar", name: "US Dollar / South African Rand",    assetClass: "forex" };
    case "EURZAR":  return { id: "eurzar", name: "Euro / South African Rand",         assetClass: "forex" };
    case "GBPZAR":  return { id: "gbpzar", name: "British Pound / South African Rand", assetClass: "forex" };
    default:        return { id: symbol.toLowerCase(), name: symbol,                  assetClass: "unknown" };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// ─── Indicator Math ───────────────────────────────────────────────────────────

function calcEMA(closes: number[], period: number): number {
  if (closes.length < period) return 0;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcWilderSmoothing(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const result: number[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  result.push(sum / period);
  for (let i = period; i < values.length; i++) {
    result.push((result[result.length - 1] * (period - 1) + values[i]) / period);
  }
  return result;
}

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gains.push(d > 0 ? d : 0);
    losses.push(d < 0 ? -d : 0);
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calcATR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (closes.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    trs.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i]  - closes[i - 1]),
    ));
  }
  const smoothed = calcWilderSmoothing(trs, period);
  return smoothed[smoothed.length - 1] ?? 0;
}

function calcADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
): { adx: number; plusDI: number; minusDI: number } {
  const fallback = { adx: 0, plusDI: 0, minusDI: 0 };
  if (closes.length < period * 2 + 1) return fallback;

  const trs: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    trs.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i]  - closes[i - 1]),
    ));
    const up   = highs[i] - highs[i - 1];
    const down = lows[i - 1] - lows[i];
    plusDMs.push(up > down && up > 0 ? up : 0);
    minusDMs.push(down > up && down > 0 ? down : 0);
  }

  const smoothedTR     = calcWilderSmoothing(trs,      period);
  const smoothedPlusDM = calcWilderSmoothing(plusDMs,  period);
  const smoothedMinusDM = calcWilderSmoothing(minusDMs, period);

  const len = smoothedTR.length;
  if (len === 0) return fallback;

  const plusDIs: number[] = [];
  const minusDIs: number[] = [];
  const dxs: number[] = [];

  for (let i = 0; i < len; i++) {
    const tr = smoothedTR[i];
    if (tr === 0) { plusDIs.push(0); minusDIs.push(0); dxs.push(0); continue; }
    const pdi = (smoothedPlusDM[i] / tr) * 100;
    const mdi = (smoothedMinusDM[i] / tr) * 100;
    plusDIs.push(pdi);
    minusDIs.push(mdi);
    const diSum = pdi + mdi;
    dxs.push(diSum === 0 ? 0 : (Math.abs(pdi - mdi) / diSum) * 100);
  }

  const smoothedDX = calcWilderSmoothing(dxs, period);
  return {
    adx:     smoothedDX[smoothedDX.length - 1]   ?? 0,
    plusDI:  plusDIs[plusDIs.length - 1]           ?? 0,
    minusDI: minusDIs[minusDIs.length - 1]         ?? 0,
  };
}

// ─── Fibonacci ────────────────────────────────────────────────────────────────

function calcFibLevels(swingHigh: number, swingLow: number) {
  const range = swingHigh - swingLow;
  return {
    fib236: swingHigh - range * 0.236,
    fib382: swingHigh - range * 0.382,
    fib50:  swingHigh - range * 0.5,
    fib618: swingHigh - range * 0.618,
    fib786: swingHigh - range * 0.786,
  };
}

type FibLevels = ReturnType<typeof calcFibLevels>;

function getNearFibLevel(price: number, fibs: FibLevels, atr: number): string | null {
  if (atr <= 0 || price <= 0) return null;
  const tolerance = atr * 0.35;
  const levels: [string, number][] = [
    ["23.6%", fibs.fib236],
    ["38.2%", fibs.fib382],
    ["50%",   fibs.fib50],
    ["61.8%", fibs.fib618],
    ["78.6%", fibs.fib786],
  ];
  let nearest: string | null = null;
  let minDist = Infinity;
  for (const [label, value] of levels) {
    const dist = Math.abs(price - value);
    if (dist <= tolerance && dist < minDist) {
      minDist = dist;
      nearest = label;
    }
  }
  return nearest;
}

// ─── Candlestick Patterns ─────────────────────────────────────────────────────

type CandlePatternResult = { name: string; bias: "bullish" | "bearish" | "neutral" } | null;

function detectCandlePattern(
  opens: number[],
  highs: number[],
  lows: number[],
  closes: number[],
): CandlePatternResult {
  const len = closes.length;
  if (len < 3) return null;

  const i = len - 1;
  const o = opens[i], h = highs[i], l = lows[i], c = closes[i];
  const range = h - l;
  if (range === 0 || !o || !c) return null;

  const body        = Math.abs(c - o);
  const upperShadow = h - Math.max(o, c);
  const lowerShadow = Math.min(o, c) - l;
  const isBullish   = c > o;
  const isBearish   = c < o;

  const po = opens[i-1], ph = highs[i-1], pl = lows[i-1], pc = closes[i-1];
  const pBody      = Math.abs(pc - po);
  const pRange     = ph - pl;
  const pIsBullish = pc > po;
  const pIsBearish = pc < po;

  const ppo = opens[i-2], pph = highs[i-2], ppl = lows[i-2], ppc = closes[i-2];
  const ppIsBullish = ppc > ppo;
  const ppIsBearish = ppc < ppo;
  const ppRange     = pph - ppl;

  // Three-candle patterns (highest priority)
  if (ppRange > 0 && pRange > 0) {
    const ppMid = (ppo + ppc) / 2;
    if (ppIsBearish && pBody < ppRange * 0.35 && isBullish && c > ppMid)
      return { name: "Morning Star", bias: "bullish" };
    if (ppIsBullish && pBody < ppRange * 0.35 && isBearish && c < ppMid)
      return { name: "Evening Star", bias: "bearish" };
  }

  // Two-candle patterns
  if (pRange > 0) {
    if (pIsBearish && isBullish && o <= Math.min(po, pc) && c >= Math.max(po, pc))
      return { name: "Bullish Engulfing", bias: "bullish" };
    if (pIsBullish && isBearish && o >= Math.max(po, pc) && c <= Math.min(po, pc))
      return { name: "Bearish Engulfing", bias: "bearish" };
  }

  // Single-candle patterns
  if (body < range * 0.1)
    return { name: "Doji", bias: "neutral" };
  if (isBullish && body > range * 0.85 && upperShadow < range * 0.07 && lowerShadow < range * 0.07)
    return { name: "Bullish Marubozu", bias: "bullish" };
  if (isBearish && body > range * 0.85 && upperShadow < range * 0.07 && lowerShadow < range * 0.07)
    return { name: "Bearish Marubozu", bias: "bearish" };
  if (lowerShadow >= body * 2 && upperShadow <= range * 0.1)
    return { name: isBullish ? "Hammer" : "Hanging Man", bias: isBullish ? "bullish" : "bearish" };
  if (upperShadow >= body * 2 && lowerShadow <= range * 0.1)
    return { name: isBullish ? "Inverted Hammer" : "Shooting Star", bias: isBullish ? "bullish" : "bearish" };

  return null;
}

// ─── Score Normalisation ──────────────────────────────────────────────────────

function atrToVolatilityScore(atr: number, price: number, assetClass: AssetClass): number {
  if (price === 0) return 0;
  const atrPct = (atr / price) * 100;
  // Multipliers calibrated so "typical" daily ATR lands around 40-55
  const multiplier =
    assetClass === "crypto"      ? 25  :  // 2% normal ATR → 50
    assetClass === "forex"       ? 200 :  // 0.25% normal ATR → 50
    /* indices/commodities */      70;    // 0.7% normal ATR → 49
  return clamp(Math.round(atrPct * multiplier), 0, 100);
}

function rsiToMomentumScore(rsi: number): number {
  // Distance from neutral (50) scaled to 0-100
  // RSI=70 → 50; RSI=80 → 75; RSI=30 → 50; RSI=20 → 75
  return clamp(Math.round(Math.abs(rsi - 50) * 2.5), 0, 100);
}

function adxToTrendScore(adx: number): number {
  // ADX=20 → 40; ADX=30 → 60; ADX=40 → 80; ADX=50 → 100
  return clamp(Math.round(adx * 2), 0, 100);
}

// ─── Support & Resistance ─────────────────────────────────────────────────────

function detectSwingSR(
  highs: number[],
  lows: number[],
  price: number,
  atr: number,
): { nearestSupport: number | null; nearestResistance: number | null } {
  if (atr <= 0 || highs.length < 15) return { nearestSupport: null, nearestResistance: null };

  const N = 4;                                     // bars each side to confirm a swing pivot
  const tolerance = atr * 0.5;                     // cluster levels within half an ATR
  const lookback  = Math.min(300, highs.length);   // scan last 300 bars (~12 trading days hourly)
  const start     = Math.max(0, highs.length - lookback);

  const swingHighPrices: number[] = [];
  const swingLowPrices:  number[] = [];

  for (let i = start + N; i < highs.length - N; i++) {
    const windowH = highs.slice(i - N, i + N + 1);
    const windowL = lows.slice( i - N, i + N + 1);
    if (highs[i] === Math.max(...windowH)) swingHighPrices.push(highs[i]);
    if (lows[i]  === Math.min(...windowL)) swingLowPrices.push(lows[i]);
  }

  // Cluster nearby levels and return the most significant one
  function cluster(levels: number[]): number[] {
    const result: { price: number; count: number }[] = [];
    for (const level of levels) {
      const existing = result.find(r => Math.abs(r.price - level) <= tolerance);
      if (existing) {
        existing.price = (existing.price * existing.count + level) / (existing.count + 1);
        existing.count++;
      } else {
        result.push({ price: level, count: 1 });
      }
    }
    return result.sort((a, b) => b.count - a.count).map(r => r.price);
  }

  const supports    = cluster(swingLowPrices).filter(s => s < price).sort((a, b) => b - a);
  const resistances = cluster(swingHighPrices).filter(r => r > price).sort((a, b) => a - b);

  return {
    nearestSupport:    supports[0]    ?? null,
    nearestResistance: resistances[0] ?? null,
  };
}

// ─── Snapshot Builder ─────────────────────────────────────────────────────────

type OhlcvData = {
  opens: number[];
  highs: number[];
  lows: number[];
  closes: number[];
  volumes: number[];
  regularMarketVolume: number;
  averageDailyVolume10Day: number;
};

function buildSnapshot(
  symbol: string,
  price: number,
  previousPrice: number,
  ohlcv: OhlcvData,
): MarketSnapshot {
  const { opens, highs, lows, closes, regularMarketVolume, averageDailyVolume10Day } = ohlcv;

  const percentageMove = previousPrice > 0
    ? ((price - previousPrice) / previousPrice) * 100
    : 0;

  // Real independent indicators
  const rsi  = calcRSI(closes);
  const ema50 = calcEMA(closes, 50);
  const atr = calcATR(highs, lows, closes) || Math.max(Math.abs(price - previousPrice), price * 0.005);
  const { adx, plusDI, minusDI } = calcADX(highs, lows, closes);

  // Scores derived from independent sources
  const meta = getAssetMeta(symbol);
  const volatilityScore = atrToVolatilityScore(atr, price, meta.assetClass);
  const momentumScore   = rsiToMomentumScore(rsi);
  const trendScore      = adxToTrendScore(adx);
  const radarScore      = clamp(
    Math.round(trendScore * 0.4 + momentumScore * 0.35 + volatilityScore * 0.25),
    0,
    100,
  );

  // Bias requires both RSI and ADX directional agreement
  const bias: SignalBias =
    rsi > 55 && plusDI > minusDI ? "Bullish" :
    rsi < 45 && minusDI > plusDI ? "Bearish" :
    "Neutral";

  const trend: "UP" | "DOWN" | "FLAT" =
    adx > 20 && plusDI > minusDI  ? "UP"   :
    adx > 20 && minusDI > plusDI  ? "DOWN" :
    "FLAT";

  // Volume: ratio to 10-day average (clamped ±200)
  const volumeChange =
    regularMarketVolume > 0 && averageDailyVolume10Day > 0
      ? clamp(Math.round((regularMarketVolume / averageDailyVolume10Day - 1) * 100), -200, 200)
      : 0;

  // Swing high/low from last 120 hourly bars (~5 trading days of structure)
  const recentLows  = lows.slice(-120);
  const recentHighs = highs.slice(-120);
  const swingLow  = recentLows.length  > 0 ? Math.min(...recentLows)  : price * 0.995;
  const swingHigh = recentHighs.length > 0 ? Math.max(...recentHighs) : price * 1.005;

  // Fibonacci levels from last 480 hourly bars (~20 trading days = 1 month of structure)
  const majorHighs     = highs.slice(-480);
  const majorLows      = lows.slice(-480);
  const majorSwingHigh = majorHighs.length > 0 ? Math.max(...majorHighs) : price * 1.02;
  const majorSwingLow  = majorLows.length  > 0 ? Math.min(...majorLows)  : price * 0.98;
  const fibs           = calcFibLevels(majorSwingHigh, majorSwingLow);
  const swingLowFibLevel  = getNearFibLevel(swingLow,  fibs, atr);
  const swingHighFibLevel = getNearFibLevel(swingHigh, fibs, atr);

  // Candlestick pattern on last 3 bars
  const patternResult    = detectCandlePattern(opens, highs, lows, closes);
  const candlePattern    = patternResult?.name ?? null;
  const candlePatternBias = patternResult?.bias ?? null;

  // Support & Resistance from swing pivots (last 300 hourly bars)
  const { nearestSupport, nearestResistance } = detectSwingSR(highs, lows, price, atr);

  return {
    id: meta.id,
    symbol,
    name: meta.name,
    assetClass: meta.assetClass,
    price,
    previousPrice,
    percentageMove,
    volumeChange,
    volatilityScore,
    momentumScore,
    trendScore,
    atr,
    radarScore,
    bias,
    trend,
    rsi,
    adx,
    plusDI,
    minusDI,
    ema50,
    swingLow,
    swingHigh,
    swingLowFibLevel,
    swingHighFibLevel,
    candlePattern,
    candlePatternBias,
    nearestSupport,
    nearestResistance,
  };
}

// ─── Yahoo Finance Fetch ──────────────────────────────────────────────────────

export async function fetchYahooMarket(): Promise<MarketMover[]> {
  const snapshots = await getRealMarketSnapshots();
  return snapshots.map((s) => ({
    symbol: s.symbol,
    price: s.price,
    changePercent: s.percentageMove,
  }));
}

async function fetchSymbolSnapshot(yahooSymbol: string): Promise<MarketSnapshot | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1h&range=60d`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta     = result.meta;
    const price    = Number(meta?.regularMarketPrice);
    // Yahoo uses different field names across asset types (stocks vs futures vs forex)
    const prevClose = Number(
      meta?.chartPreviousClose ??
      meta?.regularMarketPreviousClose ??
      meta?.previousClose
    );
    if (!Number.isFinite(price) || !Number.isFinite(prevClose) || prevClose <= 0) return null;

    const mappedSymbol = mapSymbol(yahooSymbol);
    if (!mappedSymbol || !isExnessAllowedAsset(mappedSymbol)) return null;

    const quote   = result.indicators?.quote?.[0] ?? {};
    const opens   = (quote.open   as number[] | undefined) ?? [];
    const highs   = (quote.high   as number[] | undefined) ?? [];
    const lows    = (quote.low    as number[] | undefined) ?? [];
    const closes  = (quote.close  as number[] | undefined) ?? [];
    const volumes = (quote.volume as number[] | undefined) ?? [];

    const validLen    = Math.min(opens.length, highs.length, lows.length, closes.length);
    const cleanOpens  = opens.slice(0, validLen).map(Number).filter(Number.isFinite);
    const cleanHighs  = highs.slice(0, validLen).map(Number).filter(Number.isFinite);
    const cleanLows   = lows.slice(0, validLen).map(Number).filter(Number.isFinite);
    const cleanCloses = closes.slice(0, validLen).map(Number).filter(Number.isFinite);
    const cleanLen    = Math.min(cleanOpens.length, cleanHighs.length, cleanLows.length, cleanCloses.length);

    if (cleanLen < 50) return null; // need at least 50 hourly bars for reliable indicators

    const regularMarketVolume     = Number(meta?.regularMarketVolume)     || 0;
    const averageDailyVolume10Day  = Number(meta?.averageDailyVolume10Day) || 0;

    return buildSnapshot(mappedSymbol, price, prevClose, {
      opens:   cleanOpens.slice(0, cleanLen),
      highs:   cleanHighs.slice(0, cleanLen),
      lows:    cleanLows.slice(0, cleanLen),
      closes:  cleanCloses.slice(0, cleanLen),
      volumes: volumes.slice(0, validLen).map(Number),
      regularMarketVolume,
      averageDailyVolume10Day,
    });
  } catch (err) {
    console.error(`Yahoo snapshot error for ${yahooSymbol}:`, err);
    return null;
  }
}

export async function getRealMarketSnapshots(): Promise<MarketSnapshot[]> {
  try {
    const BATCH_SIZE = 6;
    const all = [...SYMBOLS];
    const results: (MarketSnapshot | null)[] = [];

    for (let i = 0; i < all.length; i += BATCH_SIZE) {
      const batch = all.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(fetchSymbolSnapshot));
      results.push(...batchResults);
      // Small pause between batches to avoid Yahoo rate-limiting
      if (i + BATCH_SIZE < all.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    return results.filter((s): s is MarketSnapshot => s !== null);
  } catch (err) {
    console.error("Yahoo Market Snapshot Error:", err);
    return [];
  }
}
