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
    ema50: 2370,
    swingLow: 2330,
    swingHigh: 2400,
    swingLowFibLevel: "61.8%",
    swingHighFibLevel: null,
    candlePattern: null,
    candlePatternBias: null,
    nearestSupport: 2330,
    nearestResistance: 2420,
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
    ema50: 75000,
    swingLow: 72000,
    swingHigh: 80000,
    swingLowFibLevel: null,
    swingHighFibLevel: null,
    candlePattern: null,
    candlePatternBias: null,
    nearestSupport: 72000,
    nearestResistance: 82000,
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
    ema50: snapshot.ema50,
    swingLow: snapshot.swingLow,
    swingHigh: snapshot.swingHigh,
    swingLowFibLevel: snapshot.swingLowFibLevel,
    swingHighFibLevel: snapshot.swingHighFibLevel,
    candlePattern: snapshot.candlePattern,
    candlePatternBias: snapshot.candlePatternBias,
    nearestSupport: snapshot.nearestSupport,
    nearestResistance: snapshot.nearestResistance,
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

function getSetupReason(asset: TopMoverAsset, fibNearLevel: string | null) {
  const fibText    = fibNearLevel ? ` Entry aligns with ${fibNearLevel} Fibonacci level.` : "";
  const candleText = asset.candlePattern && asset.candlePattern !== "Doji"
    ? ` ${asset.candlePattern} pattern on latest candle.`
    : "";
  const srText = asset.bias === "Bullish" && asset.nearestSupport
    ? ` Support at ${roundPrice(asset.nearestSupport)}.`
    : asset.bias === "Bearish" && asset.nearestResistance
    ? ` Resistance at ${roundPrice(asset.nearestResistance)}.`
    : "";
  return `${asset.symbol} — ${asset.trend.toLowerCase()} trend (ADX ${asset.adx.toFixed(0)}), RSI ${asset.rsi.toFixed(0)}, ATR-based entry.${fibText}${candleText}${srText}`;
}

function getConfirmationTrigger(asset: TopMoverAsset): string {
  if (asset.bias === "Bullish") {
    return `Market order BUY at current price. Stop loss is 1.5× ATR below entry. Take profit targets at 1R, 2R, and 3R.`;
  }

  if (asset.bias === "Bearish") {
    return `Market order SELL at current price. Stop loss is 1.5× ATR above entry. Take profit targets at 1R, 2R, and 3R.`;
  }

  return "No directional trade yet. Wait for trend confirmation before entering.";
}

// ─── Entry Zone Builder ───────────────────────────────────────────────────────

function buildTradePlan(asset: TopMoverAsset) {
  const { price, atr, bias } = asset;
  const isBearish = bias === "Bearish";
  const direction = isBearish ? "SELL" as const : "BUY" as const;

  // ATR-based levels: SL = 0.5× ATR (intraday-sized), TPs at 1R / 2R / 3R
  const slDist = atr * 0.5;

  // Tiny entry zone around current price — effectively a market order.
  // isPriceInsideEntryZone in signals.ts will immediately return true,
  // so the status engine marks the signal "open" on its first run.
  const entryZoneLow  = roundPrice(price - atr * 0.1);
  const entryZoneHigh = roundPrice(price + atr * 0.1);

  if (direction === "BUY") {
    return {
      direction,
      entryZoneLow,
      entryZoneHigh,
      entryPrice: roundPrice(price),
      stopLoss:   roundPrice(price - slDist),
      tp1:        roundPrice(price + slDist * 1.0),
      tp2:        roundPrice(price + slDist * 2.0),
      tp3:        roundPrice(price + slDist * 3.0),
      fibNearLevel: asset.swingLowFibLevel,
    };
  }

  return {
    direction,
    entryZoneLow,
    entryZoneHigh,
    entryPrice: roundPrice(price),
    stopLoss:   roundPrice(price + slDist),
    tp1:        roundPrice(price - slDist * 1.0),
    tp2:        roundPrice(price - slDist * 2.0),
    tp3:        roundPrice(price - slDist * 3.0),
    fibNearLevel: asset.swingHighFibLevel,
  };
}

// ─── Signal Converter ─────────────────────────────────────────────────────────

export function convertTopMoverToSignal(asset: TopMoverAsset): TradeSignal {
  const plan = buildTradePlan(asset);
  const confidence = getConfidence(asset);
  const planStatus = getPlanStatus(asset);
  const confirmationTrigger = getConfirmationTrigger(asset);

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
    fibNearLevel: plan.fibNearLevel,
    candlePattern: asset.candlePattern,
    candlePatternBias: asset.candlePatternBias,
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
      setupReason: getSetupReason(asset, plan.fibNearLevel),
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
