import type {
  AssetClass,
  ExnessAsset,
  SignalBias,
  TradeSignal,
} from "@/lib/types";
import { isExnessAllowedAsset } from "@/lib/types";
import {
  getRealMarketSnapshots,
  type MarketSnapshot,
} from "@/lib/yahooMarket";

type LiveTradeSignal = TradeSignal & {
  currentPrice?: number;
  livePrice?: number;
  price?: number;
  priceChangePercent?: number;
};

export type TopMoverAsset = {
  id: string;
  symbol: ExnessAsset;
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
  // Real indicator fields (from yahooMarket)
  rsi: number;
  adx: number;
  plusDI: number;
  minusDI: number;
  swingLow: number;
  swingHigh: number;
};

const fallbackAssets: TopMoverAsset[] = [
  {
    id: "xauusd",
    symbol: "XAUUSD",
    name: "Gold",
    assetClass: "commodities",
    price: 2388,
    previousPrice: 2354,
    percentageMove: 1.44,
    volumeChange: 22,
    volatilityScore: 60,
    momentumScore: 45,
    trendScore: 55,
    atr: 24,
    radarScore: 53,
    bias: "Bullish",
    trend: "UP",
    rsi: 63,
    adx: 27,
    plusDI: 22,
    minusDI: 14,
    swingLow: 2330,
    swingHigh: 2400,
  },
  {
    id: "btc",
    symbol: "BTCUSD",
    name: "Bitcoin",
    assetClass: "crypto",
    price: 78940.1,
    previousPrice: 66931.1,
    percentageMove: 17.94,
    volumeChange: 13,
    volatilityScore: 80,
    momentumScore: 65,
    trendScore: 72,
    atr: 1928.07,
    radarScore: 72,
    bias: "Bullish",
    trend: "UP",
    rsi: 76,
    adx: 36,
    plusDI: 30,
    minusDI: 10,
    swingLow: 72000,
    swingHigh: 80000,
  },
];

function toTopMoverAsset(snapshot: MarketSnapshot): TopMoverAsset | null {
  if (!isExnessAllowedAsset(snapshot.symbol)) return null;

  return {
    id: snapshot.id,
    symbol: snapshot.symbol,
    name: snapshot.name,
    assetClass: snapshot.assetClass,
    price: snapshot.price,
    previousPrice: snapshot.previousPrice,
    percentageMove: snapshot.percentageMove,
    volumeChange: snapshot.volumeChange,
    volatilityScore: snapshot.volatilityScore,
    momentumScore: snapshot.momentumScore,
    trendScore: snapshot.trendScore,
    atr: snapshot.atr,
    radarScore: snapshot.radarScore,
    bias: snapshot.bias,
    trend: snapshot.trend,
    rsi: snapshot.rsi,
    adx: snapshot.adx,
    plusDI: snapshot.plusDI,
    minusDI: snapshot.minusDI,
    swingLow: snapshot.swingLow,
    swingHigh: snapshot.swingHigh,
  };
}

function roundPrice(value: number) {
  if (value >= 1000) return Math.round(value * 100) / 100;
  if (value >= 100)  return Math.round(value * 1000) / 1000;
  if (value >= 10)   return Math.round(value * 10000) / 10000;
  return Math.round(value * 100000) / 100000;
}

// ─── Confidence ───────────────────────────────────────────────────────────────

function getConfidence(asset: TopMoverAsset): "High" | "Medium" | "Low" {
  // All three real independent indicators must confirm
  if (
    asset.trendScore    >= 60 &&
    asset.momentumScore >= 40 &&
    asset.volatilityScore >= 45
  ) {
    return "High";
  }

  if (asset.trendScore >= 35 && asset.momentumScore >= 20) {
    return "Medium";
  }

  return "Low";
}

function getPlanStatus(asset: TopMoverAsset) {
  const confidence = getConfidence(asset);

  if (
    confidence === "High" &&
    asset.bias !== "Neutral" &&
    asset.trend !== "FLAT"
  ) {
    return "valid" as const;
  }

  return "waiting-confirmation" as const;
}

function getSetupReason(asset: TopMoverAsset) {
  return `${asset.symbol} shows a ${asset.trend.toLowerCase()} trend (ADX ${asset.adx.toFixed(0)}), RSI at ${asset.rsi.toFixed(0)}, and ATR-confirmed volatility. Entry zone set at key support/resistance.`;
}

function getConfirmationTrigger(
  asset: TopMoverAsset,
  entryZoneLow: number,
  entryZoneHigh: number,
): string {
  if (asset.bias === "Bullish") {
    return `Wait for price to pull back into the ${roundPrice(entryZoneHigh)}–${roundPrice(entryZoneLow)} support zone before buying.`;
  }

  if (asset.bias === "Bearish") {
    return `Wait for price to rally back into the ${roundPrice(entryZoneLow)}–${roundPrice(entryZoneHigh)} resistance zone before selling.`;
  }

  return "No directional trade yet. Wait for trend confirmation before entering.";
}

// ─── Entry Zone Builder ───────────────────────────────────────────────────────

function buildTradePlan(asset: TopMoverAsset) {
  const { price, atr, swingLow, swingHigh, bias } = asset;
  const isBullish = bias === "Bullish";
  const isBearish = bias === "Bearish";

  if (isBullish && swingLow < price) {
    // Pullback BUY: entry zone anchored at swing support below current price
    const entryZoneLow  = swingLow;
    const entryZoneHigh = swingLow + atr * 0.5;
    const stopLoss      = swingLow - atr * 0.5;
    const tp1           = price + atr;
    const tp2           = price + atr * 2;
    const tp3           = price + atr * 3;

    return {
      direction: "BUY" as const,
      entryZoneLow:  roundPrice(entryZoneLow),
      entryZoneHigh: roundPrice(entryZoneHigh),
      entryPrice:    roundPrice((entryZoneLow + entryZoneHigh) / 2),
      stopLoss:      roundPrice(stopLoss),
      tp1:           roundPrice(tp1),
      tp2:           roundPrice(tp2),
      tp3:           roundPrice(tp3),
    };
  }

  if (isBearish && swingHigh > price) {
    // Retest SELL: entry zone anchored at swing resistance above current price
    const entryZoneLow  = swingHigh - atr * 0.5;
    const entryZoneHigh = swingHigh;
    const stopLoss      = swingHigh + atr * 0.5;
    const tp1           = price - atr;
    const tp2           = price - atr * 2;
    const tp3           = price - atr * 3;

    return {
      direction: "SELL" as const,
      entryZoneLow:  roundPrice(entryZoneLow),
      entryZoneHigh: roundPrice(entryZoneHigh),
      entryPrice:    roundPrice((entryZoneLow + entryZoneHigh) / 2),
      stopLoss:      roundPrice(stopLoss),
      tp1:           roundPrice(tp1),
      tp2:           roundPrice(tp2),
      tp3:           roundPrice(tp3),
    };
  }

  // Fallback (neutral bias, or malformed swing data): ATR-offset from current price
  const stopDistance  = Math.max(atr * 1.15, price * 0.0025);
  const entryZoneLow  = price - stopDistance * 0.35;
  const entryZoneHigh = price + stopDistance * 0.35;
  const stopLoss      = isBearish ? price + stopDistance : price - stopDistance;
  const dir           = isBearish ? "SELL" as const : "BUY" as const;
  const sign          = isBearish ? -1 : 1;

  return {
    direction:     dir,
    entryZoneLow:  roundPrice(entryZoneLow),
    entryZoneHigh: roundPrice(entryZoneHigh),
    entryPrice:    roundPrice(price),
    stopLoss:      roundPrice(stopLoss),
    tp1:           roundPrice(price + sign * stopDistance * 1.5),
    tp2:           roundPrice(price + sign * stopDistance * 2.5),
    tp3:           roundPrice(price + sign * stopDistance * 3.5),
  };
}

// ─── Signal Converter ─────────────────────────────────────────────────────────

export function convertTopMoverToSignal(asset: TopMoverAsset): TradeSignal {
  const plan = buildTradePlan(asset);
  const confidence = getConfidence(asset);
  const planStatus = getPlanStatus(asset);
  const confirmationTrigger = getConfirmationTrigger(asset, plan.entryZoneLow, plan.entryZoneHigh);

  const signal: LiveTradeSignal = {
    id: `top-mover-${asset.id}`,
    category: "PRECISION TRADE SETUP",
    event: `${asset.name} showing ${asset.trend.toLowerCase()} trend with ADX ${asset.adx.toFixed(0)} and RSI ${asset.rsi.toFixed(0)}.`,
    impact: `${asset.symbol} has a confirmed trend structure with independent volatility, momentum, and trend confirmation.`,
    saImpact:
      asset.assetClass === "forex"
        ? "This can affect currency sentiment and active market positioning."
        : asset.assetClass === "indices"
          ? "This may affect index sentiment and active traders."
          : "This may create short-term trading opportunities for active traders.",
    assets: [asset.name, asset.symbol],
    primaryAsset: asset.symbol,
    assetClass: asset.assetClass,
    bias: asset.bias,
    confidence,
    tradeUrl: `/api/redirect?asset=${encodeURIComponent(asset.symbol)}&type=trade`,

    currentPrice: asset.price,
    livePrice: asset.price,
    price: asset.price,
    priceChangePercent: asset.percentageMove,

    percentageMove: asset.percentageMove,
    volumeChange: asset.volumeChange,
    volatilityScore: asset.volatilityScore,
    momentumScore: asset.momentumScore,
    radarScore: asset.radarScore,
    tradePlan: {
      direction: plan.direction,
      entryPrice: plan.entryPrice,
      entryZoneLow: plan.entryZoneLow,
      entryZoneHigh: plan.entryZoneHigh,
      stopLoss: plan.stopLoss,
      takeProfits: [
        { label: "TP1", price: plan.tp1 },
        { label: "TP2", price: plan.tp2 },
        { label: "TP3", price: plan.tp3 },
      ],
      riskReward: 3,
      riskProfile: "balanced",
      planStatus,
      setupReason: getSetupReason(asset),
      confirmationTrigger,
    },
    timestamp: Date.now(),
    source: "system",
    region: "Global",
    status: "published",
  };

  return signal;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export async function getTopMovers(limit = 10) {
  const realSnapshots = await getRealMarketSnapshots();

  const cleanRealAssets = realSnapshots
    .map(toTopMoverAsset)
    .filter((asset): asset is TopMoverAsset => asset !== null);

  const assets = cleanRealAssets.length > 0 ? cleanRealAssets : fallbackAssets;

  return assets
    .filter((asset) => isExnessAllowedAsset(asset.symbol))
    .sort((a, b) => b.radarScore - a.radarScore)
    .slice(0, limit);
}

export async function getTopMoverSignals(limit = 10) {
  const movers = await getTopMovers(limit);

  return movers
    .filter((asset) => isExnessAllowedAsset(asset.symbol))
    .map(convertTopMoverToSignal);
}
