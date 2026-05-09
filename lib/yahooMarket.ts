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
  // Real indicator fields
  rsi: number;
  adx: number;
  plusDI: number;
  minusDI: number;
  swingLow: number;
  swingHigh: number;
};

const SYMBOLS = [
  "BTC-USD",
  "ETH-USD",
  "^NDX",
  "^GSPC",
  "GC=F",
  "EURUSD=X",
  "GBPUSD=X",
  "JPY=X",
  "CL=F",
  "BZ=F",
] as const;

function mapSymbol(yahooSymbol: string): string | null {
  switch (yahooSymbol) {
    case "BTC-USD":   return "BTCUSD";
    case "ETH-USD":   return "ETHUSD";
    case "^NDX":      return "NAS100";
    case "^GSPC":     return "SPX500";
    case "GC=F":      return "XAUUSD";
    case "EURUSD=X":  return "EURUSD";
    case "GBPUSD=X":  return "GBPUSD";
    case "JPY=X":     return "USDJPY";
    case "CL=F":      return "USOIL";
    case "BZ=F":      return "BRENT";
    default:          return null;
  }
}

function getAssetMeta(symbol: string): {
  id: string;
  name: string;
  assetClass: AssetClass;
} {
  switch (symbol) {
    case "BTCUSD":  return { id: "btc",    name: "Bitcoin",                    assetClass: "crypto" };
    case "ETHUSD":  return { id: "eth",    name: "Ethereum",                   assetClass: "crypto" };
    case "NAS100":  return { id: "nasdaq", name: "Nasdaq 100",                 assetClass: "indices" };
    case "SPX500":  return { id: "spx",    name: "S&P 500",                    assetClass: "indices" };
    case "XAUUSD":  return { id: "xauusd", name: "Gold",                       assetClass: "commodities" };
    case "EURUSD":  return { id: "eurusd", name: "Euro / US Dollar",           assetClass: "forex" };
    case "GBPUSD":  return { id: "gbpusd", name: "British Pound / US Dollar",  assetClass: "forex" };
    case "USDJPY":  return { id: "usdjpy", name: "US Dollar / Japanese Yen",   assetClass: "forex" };
    case "USOIL":   return { id: "usoil",  name: "US Crude Oil",               assetClass: "commodities" };
    case "BRENT":   return { id: "brent",  name: "Brent Crude Oil",            assetClass: "commodities" };
    default:        return { id: symbol.toLowerCase(), name: symbol,           assetClass: "unknown" };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// ─── Indicator Math ───────────────────────────────────────────────────────────

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
  const { highs, lows, closes, regularMarketVolume, averageDailyVolume10Day } = ohlcv;

  const percentageMove = previousPrice > 0
    ? ((price - previousPrice) / previousPrice) * 100
    : 0;

  // Real independent indicators
  const rsi = calcRSI(closes);
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

  // Swing high/low from last 5 candles (one trading week of structure)
  const recentLows  = lows.slice(-5);
  const recentHighs = highs.slice(-5);
  const swingLow  = recentLows.length  > 0 ? Math.min(...recentLows)  : price * 0.995;
  const swingHigh = recentHighs.length > 0 ? Math.max(...recentHighs) : price * 1.005;

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
    swingLow,
    swingHigh,
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

export async function getRealMarketSnapshots(): Promise<MarketSnapshot[]> {
  try {
    const results: MarketSnapshot[] = [];

    for (const yahooSymbol of SYMBOLS) {
      try {
        // Fetch 60 days of daily OHLCV — enough for RSI(14), ATR(14), ADX(14)
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=60d`,
          { cache: "no-store" },
        );

        if (!res.ok) continue;

        const json = await res.json();
        const result = json?.chart?.result?.[0];
        if (!result) continue;

        const meta   = result.meta;
        const price  = Number(meta?.regularMarketPrice);
        const prevClose = Number(meta?.chartPreviousClose);

        if (!Number.isFinite(price) || !Number.isFinite(prevClose) || prevClose <= 0) continue;

        const mappedSymbol = mapSymbol(yahooSymbol);
        if (!mappedSymbol || !isExnessAllowedAsset(mappedSymbol)) continue;

        // Extract OHLCV arrays
        const quote   = result.indicators?.quote?.[0] ?? {};
        const opens   = (quote.open   as number[] | undefined)  ?? [];
        const highs   = (quote.high   as number[] | undefined)  ?? [];
        const lows    = (quote.low    as number[] | undefined)  ?? [];
        const closes  = (quote.close  as number[] | undefined)  ?? [];
        const volumes = (quote.volume as number[] | undefined)  ?? [];

        // Filter out null/undefined entries Yahoo sometimes returns for partial bars
        const validLen = Math.min(opens.length, highs.length, lows.length, closes.length);
        const cleanHighs  = highs.slice(0, validLen).map(Number).filter(Number.isFinite);
        const cleanLows   = lows.slice(0, validLen).map(Number).filter(Number.isFinite);
        const cleanCloses = closes.slice(0, validLen).map(Number).filter(Number.isFinite);

        // Need at least 30 bars for meaningful ADX(14)
        if (cleanCloses.length < 20) continue;

        const regularMarketVolume    = Number(meta?.regularMarketVolume)    || 0;
        const averageDailyVolume10Day = Number(meta?.averageDailyVolume10Day) || 0;

        results.push(buildSnapshot(mappedSymbol, price, prevClose, {
          opens:   opens.slice(0, validLen).map(Number),
          highs:   cleanHighs,
          lows:    cleanLows,
          closes:  cleanCloses,
          volumes: volumes.slice(0, validLen).map(Number),
          regularMarketVolume,
          averageDailyVolume10Day,
        }));
      } catch (symbolErr) {
        console.error(`Yahoo snapshot error for ${yahooSymbol}:`, symbolErr);
      }
    }

    return results;
  } catch (err) {
    console.error("Yahoo Market Snapshot Error:", err);
    return [];
  }
}
