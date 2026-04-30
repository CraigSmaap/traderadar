"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import FloatingTradeButton from "@/components/ui/FloatingTradeButton";
import ProUpgradeCard from "@/components/ui/ProUpgradeCard";
import PricingPanel from "@/components/ui/PricingPanel";
import RiskGuardrails from "@/components/ui/RiskGuardrails";
import AlertsPanel from "@/components/ui/AlertsPanel";
import MarketSessionClock from "@/components/ui/MarketSessionClock";
import SignalCard from "@/components/signals/SignalCard";
import { signals as fallbackSignals } from "@/data/signals";
import { filterVisibleSignals } from "@/lib/adminSignals";
import {
  getVisibleSignalLimit,
  normalizeAccessTier,
  type AccessTier,
} from "@/lib/access";
import { createClient } from "@/lib/supabase/client";
import { getCurrentSession, getSessionBoost } from "@/lib/session";
import type { TradeSignal } from "@/lib/types";
import { saveSignalHistory } from "@/lib/signalHistory";

const REFRESH_INTERVAL_MS = 30000;

const CORE_ASSETS = [
  "XAUUSD",
  "XAU/USD",
  "GOLD",
  "BTC",
  "BTCUSD",
  "BTC/USD",
  "USTEC",
  "NAS100",
  "US100",
  "EURUSD",
  "EUR/USD",
  "XAGUSD",
  "XAG/USD",
  "SILVER",
  "USOIL",
  "WTI",
  "USDJPY",
  "USD/JPY",
  "GBPUSD",
  "GBP/USD",
  "US30",
  "GBPJPY",
  "GBP/JPY",
];

type TopMover = {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  price: number;
  previousPrice: number;
  percentageMove: number;
  volumeChange: number;
  volatilityScore: number;
  momentumScore: number;
  radarScore: number;
  bias: string;
};

type SignalResult = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  stop_loss: number;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  status: string;
  last_price?: number | null;
  pnl_points?: number | null;
  pnl_percent?: number | null;
  result_label?: string | null;
};

type MarketApiResponse = {
  ok: boolean;
  generatedAt: string;
  movers: TopMover[];
  signals: TradeSignal[];
};

function normalizeAsset(value?: string) {
  return (value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace("-", "")
    .replace("/", "")
    .trim();
}

function isCoreAsset(signal: TradeSignal) {
  const primaryAsset = normalizeAsset(signal.primaryAsset);
  const assets = signal.assets?.map(normalizeAsset) || [];

  return CORE_ASSETS.map(normalizeAsset).some((coreAsset) => {
    return primaryAsset === coreAsset || assets.includes(coreAsset);
  });
}

function rankSignals(signals: TradeSignal[]) {
  const session = getCurrentSession();
  const sessionBoost = getSessionBoost(session);

  return signals
    .map((signal) => {
      const coreBoost = isCoreAsset(signal) ? 1 : 0;
      const baseScore = signal.radarScore || 0;
      const finalScore = baseScore + sessionBoost + coreBoost;

      return {
        ...signal,
        radarScore: finalScore,
      };
    })
    .sort((a, b) => (b.radarScore || 0) - (a.radarScore || 0));
}

function getSignalAsset(signal: TradeSignal) {
  return signal.primaryAsset || signal.assets?.[0] || "Unknown Asset";
}

function getSignalDirection(signal: TradeSignal) {
  const planDirection = signal.tradePlan?.direction;

  if (planDirection === "BUY" || planDirection === "SELL") {
    return planDirection;
  }

  const bias = String(signal.bias || "").toLowerCase();

  if (bias.includes("bull")) return "BUY";
  if (bias.includes("bear")) return "SELL";

  return "WAIT";
}

function getStrength(score?: number) {
  if (!score) return "Weak";
  if (score >= 80 || score >= 8) return "Strong";
  if (score >= 60 || score >= 5) return "Good";
  return "Weak";
}

function formatNumber(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";

  return value.toLocaleString("en-US", {
    maximumFractionDigits: value > 100 ? 2 : 5,
  });
}

function formatPercent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";

  const sign = value > 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}%`;
}

function getDirectionStyles(direction: string) {
  if (direction === "BUY") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (direction === "SELL") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
}

function getStatusLabel(status?: string) {
  if (!status || status === "open") return "OPEN";
  if (status === "waiting") return "WAITING ENTRY";
  if (status === "tp1_hit") return "TP1 HIT";
  if (status === "tp2_hit") return "TP2 HIT";
  if (status === "tp3_hit") return "TP3 HIT";
  if (status === "sl_hit") return "SL HIT";
  if (status === "expired") return "EXPIRED";
  if (status === "stale") return "NO MOVEMENT";
  return status.toUpperCase();
}

function getStatusStyles(status?: string) {
  if (status === "sl_hit") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (status === "tp1_hit" || status === "tp2_hit" || status === "tp3_hit") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "waiting") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }

  if (status === "expired") {
    return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }

  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

function getResultLabel(result?: SignalResult) {
  if (!result?.result_label) return "WAITING";

  return result.result_label;
}

function getResultStyles(label?: string | null) {
  if (label === "WIN") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (label === "LOSS") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (label === "RUNNING") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (label === "EXPIRED") {
    return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }

  return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
}

function getPnlColor(value?: number | null) {
  if (typeof value !== "number") return "text-zinc-300";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-red-300";
  return "text-zinc-300";
}

function getSignalResultKey(
  asset: string,
  direction: string,
  entryPrice?: number
) {
  return `${normalizeAsset(asset)}-${direction}-${entryPrice ?? "no-entry"}`;
}

function findSignalResult(signal: TradeSignal, results: SignalResult[]) {
  const asset = getSignalAsset(signal);
  const direction = getSignalDirection(signal);

  return results.find((result) => {
    return (
      normalizeAsset(result.asset) === normalizeAsset(asset) &&
      result.direction === direction
    );
  });
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getStatusStyles(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function ResultBadge({ label }: { label?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getResultStyles(
        label
      )}`}
    >
      {label || "WAITING"}
    </span>
  );
}

function TpProgress({ result }: { result?: SignalResult }) {
  const status = result?.status || "open";

  const tp1Hit =
    status === "tp1_hit" || status === "tp2_hit" || status === "tp3_hit";
  const tp2Hit = status === "tp2_hit" || status === "tp3_hit";
  const tp3Hit = status === "tp3_hit";
  const slHit = status === "sl_hit";

  return (
    <div className="grid grid-cols-4 gap-2">
      <ProgressPill label="TP1" active={tp1Hit} danger={false} />
      <ProgressPill label="TP2" active={tp2Hit} danger={false} />
      <ProgressPill label="TP3" active={tp3Hit} danger={false} />
      <ProgressPill label="SL" active={slHit} danger />
    </div>
  );
}

function ProgressPill({
  label,
  active,
  danger,
}: {
  label: string;
  active: boolean;
  danger: boolean;
}) {
  const activeClass = danger
    ? "border-red-500/40 bg-red-500/10 text-red-300"
    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.14em] ${
        active ? activeClass : "border-zinc-800 bg-black/30 text-zinc-500"
      }`}
    >
      {label}
    </div>
  );
}

function PerformanceCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${color || "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function BestTradeHeroCard({
  signal,
  index,
  signalResult,
}: {
  signal: TradeSignal;
  index: number;
  signalResult?: SignalResult;
}) {
  const asset = getSignalAsset(signal);
  const direction = getSignalDirection(signal);
  const strength = getStrength(signal.radarScore);
  const plan = signal.tradePlan;
  const firstTarget = plan?.takeProfits?.[0]?.price;
  const finalTarget =
    plan?.takeProfits?.[2]?.price ?? plan?.takeProfits?.[1]?.price;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-black/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Best Trade #{index + 1}
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">{asset}</h3>
          <p className="mt-1 text-sm text-zinc-400">{strength} setup</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className={`rounded-2xl border px-4 py-2 text-center ${getDirectionStyles(
              direction
            )}`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              {direction}
            </p>
          </div>

          <StatusBadge status={signalResult?.status} />
          <ResultBadge label={getResultLabel(signalResult)} />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">Running PnL</p>
          <p
            className={`mt-1 text-2xl font-black ${getPnlColor(
              signalResult?.pnl_percent
            )}`}
          >
            {formatPercent(signalResult?.pnl_percent ?? null)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">Where to Enter</p>
          <p className="mt-1 font-bold text-white">
            {plan
              ? `${formatNumber(plan.entryZoneLow)} - ${formatNumber(
                  plan.entryZoneHigh
                )}`
              : "Wait"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">Risk Limit</p>
            <p className="mt-1 font-bold text-red-300">
              {formatNumber(plan?.stopLoss)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p className="text-xs text-zinc-500">First Target</p>
            <p className="mt-1 font-bold text-emerald-300">
              {formatNumber(firstTarget)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
          <p className="text-xs text-zinc-500">Final Target</p>
          <p className="mt-1 font-bold text-emerald-300">
            {formatNumber(finalTarget)}
          </p>
        </div>

        <TpProgress result={signalResult} />
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-400">{signal.event}</p>
    </div>
  );
}

export default function LivePage() {
  const [movers, setMovers] = useState<TopMover[]>([]);
  const [rawSignals, setRawSignals] = useState<TradeSignal[]>(fallbackSignals);
  const [signals, setSignals] = useState<TradeSignal[]>(fallbackSignals);
  const [signalResults, setSignalResults] = useState<SignalResult[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accessTier, setAccessTier] = useState<AccessTier>("free");

  useEffect(() => {
    async function loadUserRole() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAccessTier("free");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setAccessTier(normalizeAccessTier(profile?.role));
    }

    loadUserRole();
  }, []);

  const loadSignalResults = useCallback(async () => {
    try {
      const response = await fetch(`/api/signals?ts=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = (await response.json()) as SignalResult[];

      setSignalResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load signal results:", error);
    }
  }, []);

  const loadMarketData = useCallback(
    async (saveHistory: boolean) => {
      try {
        setIsRefreshing(true);

        const response = await fetch(`/api/market?ts=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Market API failed: ${response.status}`);
        }

        const data = (await response.json()) as MarketApiResponse;

        const apiSignals = Array.isArray(data.signals)
          ? data.signals
          : fallbackSignals;

        const rankedSignals = rankSignals(apiSignals);
        const visibleSignals = await filterVisibleSignals(rankedSignals);

        setMovers(Array.isArray(data.movers) ? data.movers : []);
        setRawSignals(rankedSignals);
        setSignals(visibleSignals);
        setGeneratedAt(data.generatedAt || null);

        await loadSignalResults();

        if (saveHistory) {
          await saveSignalHistory(rankedSignals);
        }
      } catch (error) {
        console.error("Failed to refresh best trades:", error);

        const rankedFallbackSignals = rankSignals(fallbackSignals);
        const visibleFallbackSignals = await filterVisibleSignals(
          rankedFallbackSignals
        );

        setRawSignals(rankedFallbackSignals);
        setSignals(visibleFallbackSignals);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [loadSignalResults]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadMarketData(true);
    }, 0);

    const intervalId = window.setInterval(() => {
      loadMarketData(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [loadMarketData]);

  useEffect(() => {
    async function handleHiddenSignalsChanged() {
      const visibleSignals = await filterVisibleSignals(rawSignals);
      setSignals(visibleSignals);
    }

    window.addEventListener(
      "traderadar-hidden-signals-changed",
      handleHiddenSignalsChanged
    );

    return () => {
      window.removeEventListener(
        "traderadar-hidden-signals-changed",
        handleHiddenSignalsChanged
      );
    };
  }, [rawSignals]);

  const performanceStats = useMemo(() => {
    const total = signalResults.length;
    const open = signalResults.filter((item) => item.status === "open").length;
    const waiting = signalResults.filter((item) => item.status === "waiting")
      .length;
    const tpHits = signalResults.filter((item) =>
      ["tp1_hit", "tp2_hit", "tp3_hit"].includes(item.status)
    ).length;
    const slHits = signalResults.filter((item) => item.status === "sl_hit")
      .length;
    const completed = tpHits + slHits;
    const winRate =
      completed === 0 ? 0 : Math.round((tpHits / completed) * 100);

    const pnlValues = signalResults
      .map((item) => item.pnl_percent)
      .filter((value): value is number => typeof value === "number");

    const totalPnlPercent = pnlValues.reduce((sum, value) => sum + value, 0);
    const avgPnlPercent =
      pnlValues.length === 0 ? 0 : totalPnlPercent / pnlValues.length;

    return {
      total,
      open,
      waiting,
      tpHits,
      slHits,
      winRate,
      totalPnlPercent,
      avgPnlPercent,
    };
  }, [signalResults]);

  const topThreeSignals = useMemo(() => signals.slice(0, 3), [signals]);

  const visibleSignals = useMemo(() => {
    return signals.slice(0, getVisibleSignalLimit(accessTier));
  }, [signals, accessTier]);

  const lockedCount = Math.max(signals.length - visibleSignals.length, 0);

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),linear-gradient(135deg,rgba(24,24,27,0.96)_0%,rgba(6,6,8,0.99)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Beginner Trading Decision Engine
          </div>

          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Best Trades Right Now
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 sm:text-base">
            No charts. No confusion. See what to trade, where to enter, where
            to limit risk, and where to take profit.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Markets scanned
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {movers.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Trade plans found
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                {signals.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Updated
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-200">
                {generatedAt
                  ? `${new Date(generatedAt).toLocaleString()}${
                      isRefreshing ? " · refreshing..." : ""
                    }`
                  : isLoading
                    ? "Loading..."
                    : "Unavailable"}
              </p>
            </div>
          </div>
        </div>

        <RiskGuardrails />
        <MarketSessionClock />
        <AlertsPanel />
        <PricingPanel />

        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Signal Performance
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Proof engine
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-6 text-zinc-400">
              Tracks generated signals against their take-profit and stop-loss
              levels, including live running PnL.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
            <PerformanceCard label="Total" value={performanceStats.total} />
            <PerformanceCard label="Waiting" value={performanceStats.waiting} />
            <PerformanceCard label="Open" value={performanceStats.open} />
            <PerformanceCard
              label="TP Hits"
              value={performanceStats.tpHits}
              color="text-emerald-300"
            />
            <PerformanceCard
              label="SL Hits"
              value={performanceStats.slHits}
              color="text-red-300"
            />
            <PerformanceCard
              label="Win Rate"
              value={`${performanceStats.winRate}%`}
              color={
                performanceStats.winRate >= 50
                  ? "text-emerald-300"
                  : "text-yellow-300"
              }
            />
            <PerformanceCard
              label="Total PnL"
              value={formatPercent(performanceStats.totalPnlPercent)}
              color={getPnlColor(performanceStats.totalPnlPercent)}
            />
            <PerformanceCard
              label="Avg PnL"
              value={formatPercent(performanceStats.avgPnlPercent)}
              color={getPnlColor(performanceStats.avgPnlPercent)}
            />
          </div>
        </section>

        {topThreeSignals.length > 0 ? (
          <section className="mb-8">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  🔥 Best Trades Right Now
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Start here first
                </h2>
              </div>

              <p className="max-w-xl text-sm leading-6 text-zinc-400">
                These are the top ranked setups based on Trade Rating, session
                timing, and high-liquidity asset priority.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {topThreeSignals.map((signal, index) => {
                const signalResult = findSignalResult(signal, signalResults);

                return (
                  <BestTradeHeroCard
                    key={signal.id}
                    signal={signal}
                    index={index}
                    signalResult={signalResult}
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Access Mode
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              Current account role:{" "}
              <span className="font-semibold text-emerald-300">
                {accessTier.toUpperCase()}
              </span>
            </p>
          </div>

          <button
            onClick={() => loadMarketData(false)}
            disabled={isRefreshing}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Prices"}
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white">
            All Trade Setups
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Strongest setups are ranked first. Keep risk small and only trade
            setups that still match the plan.
          </p>
        </div>

        <div className="grid gap-6">
          {visibleSignals.map((signal) => {
            const signalResult = findSignalResult(signal, signalResults);
            const asset = getSignalAsset(signal);
            const direction = getSignalDirection(signal);
            const entryPrice = signal.tradePlan?.entryPrice;
            const key = getSignalResultKey(asset, direction, entryPrice);
            const resultLabel = getResultLabel(signalResult);

            return (
              <div key={key} className="space-y-3">
                <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                      Signal Tracking
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {asset} · {direction}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Last tracked price:{" "}
                      <span className="text-zinc-300">
                        {formatNumber(signalResult?.last_price ?? null)}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Running PnL:{" "}
                      <span
                        className={`font-semibold ${getPnlColor(
                          signalResult?.pnl_percent
                        )}`}
                      >
                        {formatPercent(signalResult?.pnl_percent ?? null)}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <StatusBadge status={signalResult?.status} />
                      <ResultBadge label={resultLabel} />
                    </div>

                    <div className="w-full sm:w-64">
                      <TpProgress result={signalResult} />
                    </div>
                  </div>
                </div>

                <SignalCard signal={signal} accessTier={accessTier} />
              </div>
            );
          })}

          {lockedCount > 0 ? <ProUpgradeCard /> : null}
        </div>
      </section>

      <FloatingTradeButton />
    </main>
  );
}