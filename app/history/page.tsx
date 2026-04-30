"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import BiasBadge from "@/components/signals/BiasBadge";
import ConfidenceBadge from "@/components/signals/ConfidenceBadge";
import {
  clearSignalHistory,
  getSignalHistory,
  type SignalHistoryItem,
} from "@/lib/signalHistory";

export default function HistoryPage() {
  const [history, setHistory] = useState<SignalHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadHistory() {
    setIsLoading(true);
    const nextHistory = await getSignalHistory();
    setHistory(nextHistory);
    setIsLoading(false);
  }

  async function handleClearHistory() {
    await clearSignalHistory();
    await loadHistory();
  }

 useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    loadHistory();
  }, 0);

  function handleHistoryChanged() {
    loadHistory();
  }

  window.addEventListener(
    "traderadar-signal-history-changed",
    handleHistoryChanged
  );

  return () => {
    window.clearTimeout(timeoutId);

    window.removeEventListener(
      "traderadar-signal-history-changed",
      handleHistoryChanged
    );
  };
}, []);

  const stats = useMemo(() => {
    return {
      total: history.length,
      strongSetups: history.filter((signal) => signal.confidence === "High")
        .length,
      bullish: history.filter((signal) => signal.bias === "Bullish").length,
      bearish: history.filter((signal) => signal.bias === "Bearish").length,
    };
  }, [history]);

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),linear-gradient(135deg,rgba(24,24,27,0.96)_0%,rgba(6,6,8,0.99)_100%)] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Signal History
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">
            Past TradeRadar setups.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
            Your signal history now saves to your TradeRadar account instead of
            only this browser.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Total Saved
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {isLoading ? "..." : stats.total}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Strong Setups
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                {isLoading ? "..." : stats.strongSetups}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Bullish
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                {isLoading ? "..." : stats.bullish}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Bearish
              </p>
              <p className="mt-2 text-2xl font-semibold text-red-300">
                {isLoading ? "..." : stats.bearish}
              </p>
            </div>
          </div>

          <button
            onClick={handleClearHistory}
            className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300"
          >
            Clear History
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
            Loading signal history...
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
            No signal history yet. Open the Live page to generate and save
            setups.
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((signal) => {
              const plan = signal.tradePlan;

              return (
                <article
                  key={`${signal.id}-${signal.savedAt}`}
                  className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <BiasBadge bias={signal.bias} />
                        <ConfidenceBadge confidence={signal.confidence} />
                      </div>

                      <h2 className="mt-4 text-xl font-semibold text-white">
                        {signal.primaryAsset || signal.assets[0]} ·{" "}
                        {signal.category}
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-400">
                        {signal.event}
                      </p>

                      <p className="mt-2 text-xs text-zinc-500">
                        Saved: {new Date(signal.savedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {plan ? (
                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                        <p className="text-xs text-zinc-500">Direction</p>
                        <p className="mt-1 font-semibold text-white">
                          {plan.direction}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                        <p className="text-xs text-zinc-500">
                          Where to Enter
                        </p>
                        <p className="mt-1 font-semibold text-white">
                          {plan.entryZoneLow} - {plan.entryZoneHigh}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                        <p className="text-xs text-zinc-500">Risk Limit</p>
                        <p className="mt-1 font-semibold text-red-300">
                          {plan.stopLoss}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                        <p className="text-xs text-zinc-500">Plan Status</p>
                        <p className="mt-1 font-semibold text-zinc-200">
                          {plan.planStatus}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}