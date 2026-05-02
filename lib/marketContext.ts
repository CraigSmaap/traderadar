import { getCurrentSession, type SessionType } from "@/lib/session";

const CRYPTO_ASSETS = [
  "BTC",
  "BTCUSD",
  "BTC/USD",
  "ETH",
  "ETHUSD",
  "ETH/USD",
  "SOL",
  "SOLUSD",
  "SOL/USD",
  "XRP",
  "XRPUSD",
  "XRP/USD",
];

export type MarketContext = {
  session: SessionType;
  isCrypto: boolean;
  sessionBoost: number;
  scoreThreshold: number;
  assetClass: "crypto" | "standard";
};

export function normalizeAsset(value?: string) {
  return (value || "").toUpperCase().replace("/", "").trim();
}

export function isCryptoAsset(value?: string) {
  const asset = normalizeAsset(value);
  return CRYPTO_ASSETS.map(normalizeAsset).includes(asset);
}

export function getSessionBoostValue(asset?: string) {
  if (isCryptoAsset(asset)) return 10;

  const session = getCurrentSession();

  if (session === "overlap") return 15;
  if (session === "london" || session === "newyork") return 10;

  return 0;
}

export function getScoreThreshold(asset?: string) {
  if (isCryptoAsset(asset)) return 70;

  const sessionBoost = getSessionBoostValue(asset);

  return sessionBoost === 0 ? 65 : 75;
}

export function getMarketContext(asset?: string): MarketContext {
  const session = getCurrentSession();
  const crypto = isCryptoAsset(asset);

  return {
    session,
    isCrypto: crypto,
    sessionBoost: getSessionBoostValue(asset),
    scoreThreshold: getScoreThreshold(asset),
    assetClass: crypto ? "crypto" : "standard",
  };
}