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

function formatNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";

  return value.toLocaleString("en-US", {
    maximumFractionDigits: value > 100 ? 2 : 5,
  });
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

function BestTradeHeroCard({
  signal,
  index,
}: {
  signal: TradeSignal;
  index: number;
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

        <div
          className={`rounded-2xl border px-4 py-2 text-center ${getDirectionStyles(
            direction
          )}`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em]">
            {direction}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
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
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-400">{signal.event}</p>
    </div>
  );
}

export default function LivePage() {
  const [movers, setMovers] = useState<TopMover[]>([]);
  const [rawSignals, setRawSignals] = useState<TradeSignal[]>(fallbackSignals);
  const [signals, setSignals] = useState<TradeSignal[]>(fallbackSignals);
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

  const loadMarketData = useCallback(async (saveHistory: boolean) => {
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
  }, []);

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
              {topThreeSignals.map((signal, index) => (
                <BestTradeHeroCard
                  key={signal.id}
                  signal={signal}
                  index={index}
                />
              ))}
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
          {visibleSignals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              accessTier={accessTier}
            />
          ))}

          {lockedCount > 0 ? <ProUpgradeCard /> : null}
        </div>
      </section>

      <FloatingTradeButton />
    </main>
  );
}