import type { TradeSignal } from "@/lib/types";

export type BrokerAction = {
  label: string;
  href: string;
  note: string;
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
      label: "Open Exness",
      href: `https://my.exness.com/pa/trading`,
      note: `Open Exness and search ${symbol}.`,
    },
    {
      label: "Open TradingView",
      href: `https://www.tradingview.com/chart/?symbol=${encodedSymbol}`,
      note: `Review ${symbol} chart before entry.`,
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