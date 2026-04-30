"use client";

import { useMemo, useState } from "react";
import type { TradeSignal } from "@/lib/types";
import {
  canUseLotCalculator,
  canViewFullTradePlan,
  type AccessTier,
} from "@/lib/access";
import LotSizeCalculator from "@/components/signals/LotSizeCalculator";

type SignalWithLiveMarket = TradeSignal & {
  currentPrice?: number;
  livePrice?: number;
  price?: number;
  priceChangePercent?: number;
  changePercent?: number;
  dailyChangePercent?: number;
  priceChange?: number;
};

function getStrength(score?: number) {
  if (!score) return "Weak";
  if (score >= 80 || score >= 8) return "Strong";
  if (score >= 60 || score >= 5) return "Good";
  return "Weak";
}

function getDirection(signal: TradeSignal) {
  const planDirection = signal.tradePlan?.direction;

  if (planDirection === "BUY" || planDirection === "SELL") {
    return planDirection;
  }

  const bias = String(signal.bias || "").toLowerCase();

  if (bias.includes("bull")) return "BUY";
  if (bias.includes("bear")) return "SELL";

  return "WAIT";
}

function formatNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: value > 100 ? 2 : 5,
  });
}

function formatPercent(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function getActionColor(direction: string) {
  if (direction === "BUY") {
    return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
  }

  if (direction === "SELL") {
    return "text-red-300 border-red-500/30 bg-red-500/10";
  }

  return "text-yellow-300 border-yellow-500/30 bg-yellow-500/10";
}

function getPriceChangeColor(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "text-zinc-300";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-red-300";
  return "text-zinc-300";
}

function getLiveMarketData(signal: TradeSignal) {
  const liveSignal = signal as SignalWithLiveMarket;

  const currentPrice =
    liveSignal.currentPrice ?? liveSignal.livePrice ?? liveSignal.price;

  const priceChangePercent =
    liveSignal.priceChangePercent ??
    liveSignal.changePercent ??
    liveSignal.dailyChangePercent ??
    liveSignal.priceChange;

  return {
    currentPrice,
    priceChangePercent,
  };
}

function getDistanceToEntry(signal: TradeSignal) {
  const plan = signal.tradePlan;
  const { currentPrice } = getLiveMarketData(signal);

  if (!plan) return undefined;

  if (typeof currentPrice !== "number" || Number.isNaN(currentPrice)) {
    return undefined;
  }

  const entryLow =
    typeof plan.entryZoneLow === "number" && !Number.isNaN(plan.entryZoneLow)
      ? plan.entryZoneLow
      : undefined;

  const entryHigh =
    typeof plan.entryZoneHigh === "number" && !Number.isNaN(plan.entryZoneHigh)
      ? plan.entryZoneHigh
      : undefined;

  if (entryLow === undefined || entryHigh === undefined) {
    return undefined;
  }

  const entryMid =
    typeof plan.entryPrice === "number" && !Number.isNaN(plan.entryPrice)
      ? plan.entryPrice
      : (entryLow + entryHigh) / 2;

  if (typeof entryMid !== "number" || Number.isNaN(entryMid) || entryMid === 0) {
    return undefined;
  }

  if (currentPrice >= entryLow && currentPrice <= entryHigh) {
    return 0;
  }

  return ((currentPrice - entryMid) / entryMid) * 100;
}

function getSetupStatus(signal: TradeSignal) {
  const plan = signal.tradePlan;
  const direction = getDirection(signal);
  const { currentPrice } = getLiveMarketData(signal);

  if (!plan) return "Wait for Setup";

  if (plan.planStatus === "invalidated") return "Invalidated";
  if (plan.planStatus === "expired") return "Expired";
  if (plan.planStatus === "waiting-confirmation") return "Wait for Entry";

  const entryLow =
    typeof plan.entryZoneLow === "number" && !Number.isNaN(plan.entryZoneLow)
      ? plan.entryZoneLow
      : undefined;

  const entryHigh =
    typeof plan.entryZoneHigh === "number" && !Number.isNaN(plan.entryZoneHigh)
      ? plan.entryZoneHigh
      : undefined;

  const stopLoss =
    typeof plan.stopLoss === "number" && !Number.isNaN(plan.stopLoss)
      ? plan.stopLoss
      : undefined;

  if (
    typeof currentPrice !== "number" ||
    Number.isNaN(currentPrice) ||
    entryLow === undefined ||
    entryHigh === undefined ||
    stopLoss === undefined
  ) {
    return "Ready to Trade";
  }

  const firstTarget = plan.takeProfits?.[0]?.price;
  const finalTarget = plan.takeProfits?.[2]?.price ?? plan.takeProfits?.[1]?.price;

  const insideEntry = currentPrice >= entryLow && currentPrice <= entryHigh;

  if (direction === "BUY") {
    if (currentPrice <= stopLoss) return "Risk Limit Hit";
    if (typeof finalTarget === "number" && currentPrice >= finalTarget) return "Trade Complete";
    if (typeof firstTarget === "number" && currentPrice >= firstTarget) return "First Target Hit";
    if (insideEntry) return "Ready to Trade";
    if (currentPrice > entryHigh) return "Missed Entry";
    return "Wait for Entry";
  }

  if (direction === "SELL") {
    if (currentPrice >= stopLoss) return "Risk Limit Hit";
    if (typeof finalTarget === "number" && currentPrice <= finalTarget) return "Trade Complete";
    if (typeof firstTarget === "number" && currentPrice <= firstTarget) return "First Target Hit";
    if (insideEntry) return "Ready to Trade";
    if (currentPrice < entryLow) return "Missed Entry";
    return "Wait for Entry";
  }

  return "Wait";
}

function buildCopyText(signal: TradeSignal, showFull: boolean) {
  const plan = signal.tradePlan;
  const asset = signal.primaryAsset || signal.assets?.[0] || "Unknown";
  const direction = getDirection(signal);
  const { currentPrice, priceChangePercent } = getLiveMarketData(signal);
  const distanceToEntry = getDistanceToEntry(signal);

  if (!plan) {
    return `TradeRadar Plan\nAsset: ${asset}\nAction: ${direction}\nNo full trade plan available yet.`;
  }

  const targets = plan.takeProfits || [];
  const firstTarget = targets[0]?.price;
  const secondTarget = targets[1]?.price;
  const finalTarget = targets[2]?.price;

  return [
    "TradeRadar Trade Plan",
    `Asset: ${asset}`,
    `Action: ${direction}`,
    `Strength: ${getStrength(signal.radarScore)}`,
    `Live Price: ${formatNumber(currentPrice)}`,
    `Today: ${formatPercent(priceChangePercent)}`,
    `Distance to Entry: ${formatPercent(distanceToEntry)}`,
    `Setup Status: ${getSetupStatus(signal)}`,
    `Where to Enter: ${formatNumber(plan.entryZoneLow)} - ${formatNumber(plan.entryZoneHigh)}`,
    `Risk Limit: ${formatNumber(plan.stopLoss)}`,
    `First Profit Target: ${formatNumber(firstTarget)}`,
    `Second Profit Target: ${formatNumber(secondTarget)}`,
    showFull
      ? `Final Profit Target: ${formatNumber(finalTarget)}`
      : "Final Profit Target: Pro only",
    "Recommended Risk: 1% - 2% max",
    "",
    "Not financial advice. Trade at your own risk.",
  ].join("\n");
}

function getTradingViewUrl(signal: TradeSignal) {
  const asset = signal.primaryAsset || signal.assets?.[0] || "";
  const symbol = asset
    .toUpperCase()
    .replace("/", "")
    .replace("GOLD", "XAUUSD")
    .replace("BRENT CRUDE", "UKOIL")
    .replace("NAS100", "NAS100");

  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`;
}

function getExnessUrl() {
  return process.env.NEXT_PUBLIC_EXNESS_AFFILIATE_URL || "https://my.exness.com/pa/";
}

export default function SignalCard({
  signal,
  accessTier,
}: {
  signal: TradeSignal;
  accessTier: AccessTier;
}) {
  const [copied, setCopied] = useState(false);

  const plan = signal.tradePlan;
  const asset = signal.primaryAsset || signal.assets?.[0] || "Unknown Asset";
  const direction = getDirection(signal);
  const strength = getStrength(signal.radarScore);
  const showFull = canViewFullTradePlan(accessTier);
  const showCalculator = canUseLotCalculator(accessTier);
  const setupStatus = getSetupStatus(signal);
  const { currentPrice, priceChangePercent } = getLiveMarketData(signal);
  const distanceToEntry = getDistanceToEntry(signal);

  const firstTarget = plan?.takeProfits?.[0]?.price;
  const secondTarget = plan?.takeProfits?.[1]?.price;
  const finalTarget = plan?.takeProfits?.[2]?.price;

  const copyText = useMemo(
    () => buildCopyText(signal, showFull),
    [signal, showFull]
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/30">
      <div className="border-b border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_35%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              TradeRadar Setup
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">{asset}</h2>
            <p className="mt-1 text-sm text-zinc-400">{signal.category}</p>
          </div>

          <div className={`rounded-2xl border px-5 py-3 text-center ${getActionColor(direction)}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
              Action
            </p>
            <p className="mt-1 text-3xl font-black">{direction}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">Live Price</p>
            <p className="mt-1 text-lg font-bold text-white">{formatNumber(currentPrice)}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">Today</p>
            <p className={`mt-1 text-lg font-bold ${getPriceChangeColor(priceChangePercent)}`}>
              {formatPercent(priceChangePercent)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">Distance to Entry</p>
            <p className={`mt-1 text-lg font-bold ${getPriceChangeColor(distanceToEntry)}`}>
              {distanceToEntry === 0 ? "In entry zone" : formatPercent(distanceToEntry)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">Setup Status</p>
            <p className="mt-1 text-lg font-bold text-white">{setupStatus}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">Strength</p>
            <p className="mt-1 text-lg font-bold text-white">{strength}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">Trade Rating</p>
            <p className="mt-1 text-lg font-bold text-emerald-300">
              {signal.radarScore ? `${Math.round(signal.radarScore)}/100` : "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">Beginner Summary</p>
            <p className="mt-1 text-lg font-bold text-white">{setupStatus}</p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-zinc-300">{signal.event}</p>
      </div>

      <div className="p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">Where to Enter</p>
            <p className="mt-1 font-bold text-white">
              {plan
                ? `${formatNumber(plan.entryZoneLow)} - ${formatNumber(plan.entryZoneHigh)}`
                : "Wait"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">Risk Limit</p>
            <p className="mt-1 font-bold text-red-300">{formatNumber(plan?.stopLoss)}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">First Profit Target</p>
            <p className="mt-1 font-bold text-emerald-300">{formatNumber(firstTarget)}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">Final Profit Target</p>
            {showFull ? (
              <p className="mt-1 font-bold text-emerald-300">
                {formatNumber(finalTarget || secondTarget)}
              </p>
            ) : (
              <p className="mt-1 font-bold text-zinc-500">Locked for Pro</p>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Beginner Risk Rule
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Not financial advice. Trade at your own risk. Use small risk per trade.
            Recommended risk: <span className="font-bold text-white">1–2%</span>.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            onClick={handleCopy}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/15"
          >
            {copied ? "Copied" : "Copy Trade Plan"}
          </button>

          <a
            href={getTradingViewUrl(signal)}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-sm font-bold text-white transition hover:border-zinc-500"
          >
            View Chart
          </a>

          <a
            href={getExnessUrl()}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-sm font-bold text-white transition hover:border-zinc-500"
          >
            Start with Exness
          </a>
        </div>

        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
          <p className="text-sm font-bold text-white">Already have a broker?</p>
          <p className="mt-1 text-sm text-zinc-400">
            Copy the trade plan or view the chart. Need a broker? Start with Exness later using your affiliate link.
          </p>
        </div>

        <div className="mt-5">
          {showCalculator && plan ? (
            <LotSizeCalculator
              defaultEntryPrice={plan.entryPrice || plan.entryZoneLow}
              defaultStopLoss={plan.stopLoss}
            />
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Lot Size Calculator
              </p>
              <h3 className="mt-2 text-lg font-bold text-white">Locked for Pro</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Pro users can calculate lot size using account balance, USD account currency, risk %, entry price and risk limit.
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}