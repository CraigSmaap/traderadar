import type { TradeSignal } from "@/lib/types";
import { EXNESS_AFFILIATE_URL } from "@/lib/access";

export { EXNESS_AFFILIATE_URL };
export const EXNESS_TRADING_URL = "https://my.exness.com/pa/trading";

export type BrokerAction = {
  label: string;
  href: string;
  note: string;
  variant?: "primary" | "secondary" | "chart";
};

function getBrokerSymbol(symbol: string) {
  const upper = symbol.toUpperCase();

  if (upper.includes("XAU")) return "XAUUSD";
  if (upper.includes("BTC")) return "BTCUSD";
  if (upper.includes("ETH")) return "ETHUSD";
  if (upper.includes("USDZAR")) return "USDZAR";
  if (upper.includes("NAS")) return "USTEC";
  if (upper.includes("SPX")) return "US500";
  if (upper.includes("BRENT")) return "UKOIL";

  return upper;
}

export function getBrokerActions(signal: TradeSignal): BrokerAction[] {
  const symbol = getBrokerSymbol(signal.primaryAsset || signal.assets[0] || "");
  const encodedSymbol = encodeURIComponent(symbol);

  return [
    {
      label: "Trade on Exness",
      href: EXNESS_TRADING_URL,
      note: `Open Exness and search ${symbol} to execute this trade.`,
      variant: "primary",
    },
    {
      label: "View Chart",
      href: `https://www.tradingview.com/chart/?symbol=${encodedSymbol}`,
      note: `Review ${symbol} chart before entry.`,
      variant: "chart",
    },
  ];
}

export function buildCopyableTradePlan(signal: TradeSignal) {
  const plan = signal.tradePlan;
  const symbol = signal.primaryAsset || signal.assets[0] || "UNKNOWN";

  if (!plan) {
    return `${symbol} trade plan unavailable.`;
  }

  const takeProfits =
    plan.takeProfits
      ?.map((target) => `${target.label}: ${target.price}`)
      .join("\n") || "TP: Not set";

  return [
    `TradeRadar Setup`,
    `Symbol: ${symbol}`,
    `Direction: ${plan.direction}`,
    `Entry Zone: ${plan.entryZoneLow} - ${plan.entryZoneHigh}`,
    `Stop Loss: ${plan.stopLoss}`,
    takeProfits,
    `Risk/Reward: 1:${plan.riskReward}`,
    `Confidence: ${signal.confidence}`,
    `Confirmation: ${plan.confirmationTrigger || "Wait for confirmation."}`,
    ``,
    `Risk warning: This is educational and not guaranteed financial advice.`,
  ].join("\n");
}