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
    case "BTC-USD":
      return "BTCUSD";
    case "ETH-USD":
      return "ETHUSD";
    case "^NDX":
      return "NAS100";
    case "^GSPC":
      return "SPX500";
    case "GC=F":
      return "XAUUSD";
    case "EURUSD=X":
      return "EURUSD";
    case "GBPUSD=X":
      return "GBPUSD";
    case "JPY=X":
      return "USDJPY";
    case "CL=F":
      return "USOIL";
    case "BZ=F":
      return "BRENT";
    default:
      return null;
  }
}

function getAssetMeta(symbol: string): {
  id: string;
  name: string;
  assetClass: AssetClass;
} {
  switch (symbol) {
    case "BTCUSD":
      return { id: "btc", name: "Bitcoin", assetClass: "crypto" };
    case "ETHUSD":
      return { id: "eth", name: "Ethereum", assetClass: "crypto" };
    case "NAS100":
      return { id: "nasdaq", name: "Nasdaq 100", assetClass: "indices" };
    case "SPX500":
      return { id: "spx", name: "S&P 500", assetClass: "indices" };
    case "XAUUSD":
      return { id: "xauusd", name: "Gold", assetClass: "commodities" };
    case "EURUSD":
      return { id: "eurusd", name: "Euro / US Dollar", assetClass: "forex" };
    case "GBPUSD":
      return { id: "gbpusd", name: "British Pound / US Dollar", assetClass: "forex" };
    case "USDJPY":
      return { id: "usdjpy", name: "US Dollar / Japanese Yen", assetClass: "forex" };
    case "USOIL":
      return { id: "usoil", name: "US Crude Oil", assetClass: "commodities" };
    case "BRENT":
      return { id: "brent", name: "Brent Crude Oil", assetClass: "commodities" };
    default:
      return { id: symbol.toLowerCase(), name: symbol, assetClass: "unknown" };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildSnapshot(symbol: string, price: number, previousPrice: number): MarketSnapshot {
  const percentageMove = ((price - previousPrice) / previousPrice) * 100;
  const absMove = Math.abs(percentageMove);

  const volatilityScore = clamp(Math.round(absMove * 18), 0, 100);
  const momentumScore = clamp(Math.round(absMove * 22), 0, 100);
  const trendScore = clamp(Math.round(50 + absMove * 8), 0, 100);
  const radarScore = clamp(
    Math.round(volatilityScore * 0.35 + momentumScore * 0.4 + trendScore * 0.25),
    0,
    100
  );

  const bias: SignalBias =
    percentageMove > 0.25 ? "Bullish" : percentageMove < -0.25 ? "Bearish" : "Neutral";

  const trend: "UP" | "DOWN" | "FLAT" =
    percentageMove > 0.25 ? "UP" : percentageMove < -0.25 ? "DOWN" : "FLAT";

  const meta = getAssetMeta(symbol);

  return {
    id: meta.id,
    symbol,
    name: meta.name,
    assetClass: meta.assetClass,
    price,
    previousPrice,
    percentageMove,
    volumeChange: 0,
    volatilityScore,
    momentumScore,
    trendScore,
    atr: Math.max(Math.abs(price - previousPrice), price * 0.005),
    radarScore,
    bias,
    trend,
  };
}

export async function fetchYahooMarket(): Promise<MarketMover[]> {
  const snapshots = await getRealMarketSnapshots();

  return snapshots.map((snapshot) => ({
    symbol: snapshot.symbol,
    price: snapshot.price,
    changePercent: snapshot.percentageMove,
  }));
}

export async function getRealMarketSnapshots(): Promise<MarketSnapshot[]> {
  try {
    const results: MarketSnapshot[] = [];

    for (const yahooSymbol of SYMBOLS) {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
        { cache: "no-store" }
      );

      if (!res.ok) continue;

      const json = await res.json();
      const result = json?.chart?.result?.[0];
      if (!result) continue;

      const meta = result.meta;
      const price = Number(meta?.regularMarketPrice);
      const previousPrice = Number(meta?.chartPreviousClose);

      if (!Number.isFinite(price) || !Number.isFinite(previousPrice) || previousPrice <= 0) {
        continue;
      }

      const mappedSymbol = mapSymbol(yahooSymbol);
      if (!mappedSymbol) continue;

      if (!isExnessAllowedAsset(mappedSymbol)) continue;

      results.push(buildSnapshot(mappedSymbol, price, previousPrice));
    }

    return results;
  } catch (err) {
    console.error("Yahoo Market Snapshot Error:", err);
    return [];
  }
}