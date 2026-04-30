import type { AssetClass, SignalBias, TradeSignal } from "@/lib/types";
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
    volatilityScore: 78,
    momentumScore: 81,
    trendScore: 74,
    atr: 24,
    radarScore: 84,
    bias: "Bullish",
    trend: "UP",
  },
  {
    id: "usdzar",
    symbol: "USDZAR",
    name: "US Dollar / South African Rand",
    assetClass: "forex",
    price: 18.42,
    previousPrice: 18.18,
    percentageMove: 1.32,
    volumeChange: 18,
    volatilityScore: 82,
    momentumScore: 78,
    trendScore: 71,
    atr: 0.18,
    radarScore: 86,
    bias: "Bullish",
    trend: "UP",
  },
];

function toTopMoverAsset(snapshot: MarketSnapshot): TopMoverAsset {
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
  };
}

function roundPrice(value: number) {
  if (value >= 1000) return Math.round(value * 100) / 100;
  if (value >= 100) return Math.round(value * 1000) / 1000;
  if (value >= 10) return Math.round(value * 10000) / 10000;
  return Math.round(value * 100000) / 100000;
}

function getAtrStopDistance(asset: TopMoverAsset) {
  const fallbackDistance = asset.price * 0.008;
  const atrDistance = asset.atr > 0 ? asset.atr * 1.15 : fallbackDistance;

  return Math.max(atrDistance, asset.price * 0.0025);
}

function getConfidence(asset: TopMoverAsset): "High" | "Medium" | "Low" {
  if (
    asset.radarScore >= 82 &&
    asset.trend !== "FLAT" &&
    Math.abs(asset.percentageMove) > 0.6
  ) {
    return "High";
  }

  if (asset.radarScore >= 60) return "Medium";

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
  return `${asset.symbol} ranks highly due to movement, volatility, momentum, volume activity, and ${asset.trend.toLowerCase()} trend structure.`;
}

function getConfirmationTrigger(asset: TopMoverAsset) {
  if (asset.bias === "Bullish") {
    return `Wait for price to hold above ${roundPrice(
      asset.price
    )} or pull back into the entry zone before buying.`;
  }

  if (asset.bias === "Bearish") {
    return `Wait for price to stay below ${roundPrice(
      asset.price
    )} or retest the entry zone before selling.`;
  }

  return "No directional trade yet. Wait for trend confirmation before entering.";
}

export async function getTopMovers(limit = 10) {
  const realSnapshots = await getRealMarketSnapshots();

  const assets =
    realSnapshots.length > 0
      ? realSnapshots.map(toTopMoverAsset)
      : fallbackAssets;

  return assets.sort((a, b) => b.radarScore - a.radarScore).slice(0, limit);
}

export function convertTopMoverToSignal(asset: TopMoverAsset): TradeSignal {
  const isBullish = asset.bias === "Bullish";
  const isBearish = asset.bias === "Bearish";

  const stopDistance = getAtrStopDistance(asset);

  const entryZoneLow = isBullish
    ? asset.price - stopDistance * 0.35
    : isBearish
      ? asset.price - stopDistance * 0.15
      : asset.price - stopDistance * 0.25;

  const entryZoneHigh = isBullish
    ? asset.price + stopDistance * 0.15
    : isBearish
      ? asset.price + stopDistance * 0.35
      : asset.price + stopDistance * 0.25;

  const stopLoss = isBullish
    ? asset.price - stopDistance
    : isBearish
      ? asset.price + stopDistance
      : asset.price - stopDistance;

  const tp1 = isBullish
    ? asset.price + stopDistance * 1.5
    : isBearish
      ? asset.price - stopDistance * 1.5
      : asset.price + stopDistance;

  const tp2 = isBullish
    ? asset.price + stopDistance * 2.5
    : isBearish
      ? asset.price - stopDistance * 2.5
      : asset.price + stopDistance * 1.5;

  const tp3 = isBullish
    ? asset.price + stopDistance * 3.5
    : isBearish
      ? asset.price - stopDistance * 3.5
      : asset.price + stopDistance * 2;

  const signal: LiveTradeSignal = {
    id: `top-mover-${asset.id}`,
    category: "PRECISION TRADE SETUP",
    event: `${asset.name} moved ${asset.percentageMove.toFixed(
      2
    )}% with ${asset.trend.toLowerCase()} trend conditions.`,
    impact: `${asset.symbol} is showing movement, volatility, momentum, and trend structure worth monitoring.`,
    saImpact:
      asset.assetClass === "forex" || asset.symbol.includes("ZAR")
        ? "This can directly affect rand sentiment and South African market positioning."
        : asset.assetClass === "stocks" || asset.assetClass === "indices"
          ? "This may affect local market sentiment and active JSE traders."
          : "This may create short-term trading opportunities for active traders.",
    assets: [asset.name, asset.symbol],
    primaryAsset: asset.symbol,
    assetClass: asset.assetClass,
    bias: asset.bias,
    confidence: getConfidence(asset),
    tradeUrl: `/api/redirect?asset=${encodeURIComponent(
      asset.symbol
    )}&type=trade`,

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
      direction: isBearish ? "SELL" : isBullish ? "BUY" : "WATCH",
      entryPrice: roundPrice(asset.price),
      entryZoneLow: roundPrice(Math.min(entryZoneLow, entryZoneHigh)),
      entryZoneHigh: roundPrice(Math.max(entryZoneLow, entryZoneHigh)),
      stopLoss: roundPrice(stopLoss),
      takeProfits: [
        { label: "TP1", price: roundPrice(tp1) },
        { label: "TP2", price: roundPrice(tp2) },
        { label: "TP3", price: roundPrice(tp3) },
      ],
      riskReward: isBearish || isBullish ? 3 : 1.5,
      riskProfile: "balanced",
      planStatus: getPlanStatus(asset),
      setupReason: `${getSetupReason(
        asset
      )} Precision entry generated using ATR pullback logic.`,
      confirmationTrigger: getConfirmationTrigger(asset),
    },
    timestamp: Date.now(),
    source: "system",
    region: "Global",
    status: "published",
  };

  return signal;
}

export async function getTopMoverSignals(limit = 10) {
  const movers = await getTopMovers(limit);
  return movers.map(convertTopMoverToSignal);
}