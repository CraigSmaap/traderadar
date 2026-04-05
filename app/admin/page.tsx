"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Header from "@/components/layout/Header";
import SignalCard from "@/components/signals/SignalCard";
import { signals as initialSignals } from "@/data/signals";
import { convertNewsToSignal } from "@/lib/news";
import { fetchNews, type LiveNewsArticle } from "@/lib/fetchNews";
import type { ConfidenceLevel, SignalBias, TradeSignal } from "@/lib/types";

type TradeClick = {
  asset?: string;
  link: string;
  time: string;
};

type NewSignalForm = {
  category: string;
  event: string;
  impact: string;
  saImpact: string;
  assets: string;
  bias: SignalBias;
  confidence: ConfidenceLevel;
  tradeUrl: string;
};

type FetchStatus = {
  fetched: number;
  relevant: number;
  added: number;
  lastRun: string | null;
};

const defaultForm: NewSignalForm = {
  category: "",
  event: "",
  impact: "",
  saImpact: "",
  assets: "",
  bias: "Bullish",
  confidence: "High",
  tradeUrl: "",
};

function subscribeToClientReady(onStoreChange: () => void) {
  onStoreChange();
  return () => {};
}

function getClientReadySnapshot() {
  return true;
}

function getClientReadyServerSnapshot() {
  return false;
}

function getStoredClicks(): TradeClick[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = window.localStorage.getItem("tradeClicks");

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored) as TradeClick[];
  } catch {
    return [];
  }
}

function getStoredSignals(): TradeSignal[] {
  if (typeof window === "undefined") {
    return initialSignals;
  }

  const stored = window.localStorage.getItem("tradeRadarSignals");

  if (!stored) {
    return initialSignals;
  }

  try {
    const parsed = JSON.parse(stored) as TradeSignal[];
    return parsed.length > 0 ? parsed : initialSignals;
  } catch {
    return initialSignals;
  }
}

function getClickSummary(clicks: TradeClick[]) {
  const counts: Record<string, number> = {};

  for (const click of clicks) {
    const asset = click.asset || "Unknown";
    counts[asset] = (counts[asset] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([asset, total]) => ({ asset, total }))
    .sort((a, b) => b.total - a.total);
}

function getSourceSummary(signals: TradeSignal[]) {
  const counts: Record<string, number> = {};

  for (const signal of signals) {
    counts[signal.source] = (counts[signal.source] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([source, total]) => ({ source, total }))
    .sort((a, b) => b.total - a.total);
}

function mergeUniqueSignals(
  existingSignals: TradeSignal[],
  incomingSignals: TradeSignal[]
) {
  const seen = new Set(
    existingSignals.map(
      (signal) => `${signal.category}|${signal.event}|${signal.source}`
    )
  );

  const uniqueIncoming = incomingSignals.filter((signal) => {
    const key = `${signal.category}|${signal.event}|${signal.source}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return {
    merged: [...uniqueIncoming, ...existingSignals],
    addedCount: uniqueIncoming.length,
  };
}

function AdminPageClient() {
  const [signals, setSignals] = useState<TradeSignal[]>(() => getStoredSignals());
  const [clicks] = useState<TradeClick[]>(() => getStoredClicks());
  const [newSignal, setNewSignal] = useState<NewSignalForm>(defaultForm);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>({
    fetched: 0,
    relevant: 0,
    added: 0,
    lastRun: null,
  });

  useEffect(() => {
    window.localStorage.setItem("tradeRadarSignals", JSON.stringify(signals));
  }, [signals]);

  const sortedSignals = useMemo(() => {
    return [...signals].sort((a, b) => b.timestamp - a.timestamp);
  }, [signals]);

  const draftSignals = useMemo(() => {
    return sortedSignals.filter((signal) => signal.status === "draft");
  }, [sortedSignals]);

  const publishedSignals = useMemo(() => {
    return sortedSignals.filter((signal) => signal.status === "published");
  }, [sortedSignals]);

  const clickSummary = useMemo(() => {
    return getClickSummary(clicks);
  }, [clicks]);

  const sourceSummary = useMemo(() => {
    return getSourceSummary(signals);
  }, [signals]);

  const handleFetchLiveNews = async () => {
    const articles = await fetchNews();

    const relevantSignals: TradeSignal[] = articles
      .filter((article: LiveNewsArticle) => Boolean(article.title))
      .map((article: LiveNewsArticle) =>
        convertNewsToSignal({
          title: article.title,
          region: "Global",
          category: "LIVE NEWS",
        })
      )
      .filter((signal): signal is TradeSignal => signal !== null);

    setSignals((prevSignals) => {
      const result = mergeUniqueSignals(prevSignals, relevantSignals);

      setFetchStatus({
        fetched: articles.length,
        relevant: relevantSignals.length,
        added: result.addedCount,
        lastRun: new Date().toLocaleString(),
      });

      return result.merged;
    });
  };

  const handleAddSignal = () => {
    if (
      !newSignal.event.trim() ||
      !newSignal.impact.trim() ||
      !newSignal.saImpact.trim() ||
      !newSignal.assets.trim()
    ) {
      return;
    }

    const now = Date.now();

    const createdSignal: TradeSignal = {
      id: now.toString(),
      category: newSignal.category.trim() || "CUSTOM SIGNAL",
      event: newSignal.event.trim(),
      impact: newSignal.impact.trim(),
      saImpact: newSignal.saImpact.trim(),
      assets: newSignal.assets
        .split(",")
        .map((asset) => asset.trim())
        .filter(Boolean),
      bias: newSignal.bias,
      confidence: newSignal.confidence,
      tradeUrl: newSignal.tradeUrl.trim() || "#",
      timestamp: now,
      source: "manual",
      region: "Global",
      status: "draft",
    };

    setSignals((prevSignals) => {
      const result = mergeUniqueSignals(prevSignals, [createdSignal]);
      return result.merged;
    });

    setNewSignal(defaultForm);
  };

  const handleDeleteSignal = (id: string) => {
    setSignals((prevSignals) =>
      prevSignals.filter((signal) => signal.id !== id)
    );
  };

  const handlePublishSignal = (id: string) => {
    setSignals((prevSignals) =>
      prevSignals.map((signal) =>
        signal.id === id ? { ...signal, status: "published" } : signal
      )
    );
  };

  const handleUnpublishSignal = (id: string) => {
    setSignals((prevSignals) =>
      prevSignals.map((signal) =>
        signal.id === id ? { ...signal, status: "draft" } : signal
      )
    );
  };

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <section className="mx-auto w-full max-w-2xl px-4 py-5">
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-lg font-semibold text-white">
            Click Analytics
          </h2>

          <p className="mb-4 text-sm text-zinc-400">
            Total Clicks: {clicks.length}
          </p>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {clickSummary.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-black p-3 text-sm text-zinc-500 sm:col-span-2">
                No click summary available yet.
              </div>
            ) : (
              clickSummary.map((item) => (
                <div
                  key={item.asset}
                  className="rounded-xl border border-zinc-800 bg-black p-3"
                >
                  <div className="text-xs text-zinc-500">Asset</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {item.asset}
                  </div>
                  <div className="mt-2 text-xs text-green-400">
                    Clicks: {item.total}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="max-h-40 space-y-2 overflow-y-auto text-xs">
            {clicks.length === 0 ? (
              <div className="rounded border border-zinc-800 p-2 text-zinc-500">
                No clicks recorded yet.
              </div>
            ) : (
              clicks
                .slice()
                .reverse()
                .map((click, index) => (
                  <div
                    key={`${click.time}-${index}`}
                    className="rounded border border-zinc-800 p-2 text-zinc-300"
                  >
                    <div>Asset: {click.asset || "Unknown"}</div>
                    <div>Time: {click.time}</div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-lg font-semibold text-white">
            Signal Source Summary
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {sourceSummary.map((item) => (
              <div
                key={item.source}
                className="rounded-xl border border-zinc-800 bg-black p-3"
              >
                <div className="text-xs uppercase text-zinc-500">Source</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {item.source}
                </div>
                <div className="mt-2 text-xs text-blue-400">
                  Signals: {item.total}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-1 text-lg font-semibold text-white">
            Admin Signal Creator
          </h2>

          <button
            onClick={handleFetchLiveNews}
            className="mb-4 w-full rounded-xl bg-blue-500 py-2 text-sm font-semibold text-black transition hover:bg-blue-600"
          >
            FETCH LIVE NEWS (TEST)
          </button>

          <div className="mb-4 rounded-xl border border-zinc-800 bg-black p-3 text-sm text-zinc-300">
            <div>Fetched Articles: {fetchStatus.fetched}</div>
            <div>Relevant Signals: {fetchStatus.relevant}</div>
            <div>New Signals Added: {fetchStatus.added}</div>
            <div>Last Run: {fetchStatus.lastRun || "Not run yet"}</div>
          </div>

          <p className="mb-4 text-sm text-zinc-400">
            Create and preview signals before publishing workflow is added.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Category (e.g. FED SIGNAL)"
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-green-500"
              value={newSignal.category}
              onChange={(e) =>
                setNewSignal({ ...newSignal, category: e.target.value })
              }
            />

            <textarea
              placeholder="Event"
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-green-500"
              value={newSignal.event}
              onChange={(e) =>
                setNewSignal({ ...newSignal, event: e.target.value })
              }
            />

            <textarea
              placeholder="Market Impact"
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-green-500"
              value={newSignal.impact}
              onChange={(e) =>
                setNewSignal({ ...newSignal, impact: e.target.value })
              }
            />

            <textarea
              placeholder="SA Impact"
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-green-500"
              value={newSignal.saImpact}
              onChange={(e) =>
                setNewSignal({ ...newSignal, saImpact: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Assets to Watch (comma separated)"
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-green-500"
              value={newSignal.assets}
              onChange={(e) =>
                setNewSignal({ ...newSignal, assets: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-green-500"
                value={newSignal.bias}
                onChange={(e) =>
                  setNewSignal({
                    ...newSignal,
                    bias: e.target.value as SignalBias,
                  })
                }
              >
                <option value="Bullish">Bullish</option>
                <option value="Bearish">Bearish</option>
                <option value="Risk-Off">Risk-Off</option>
              </select>

              <select
                className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-green-500"
                value={newSignal.confidence}
                onChange={(e) =>
                  setNewSignal({
                    ...newSignal,
                    confidence: e.target.value as ConfidenceLevel,
                  })
                }
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Trade URL"
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-green-500"
              value={newSignal.tradeUrl}
              onChange={(e) =>
                setNewSignal({ ...newSignal, tradeUrl: e.target.value })
              }
            />

            <button
              onClick={handleAddSignal}
              className="w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-black transition hover:bg-green-600 active:scale-[0.99]"
            >
              ADD SIGNAL
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Draft Signals</h3>
          <span className="text-xs text-zinc-400">
            Total Drafts: {draftSignals.length}
          </span>
        </div>

        <div className="mb-8 space-y-5">
          {draftSignals.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
              No draft signals available.
            </div>
          ) : (
            draftSignals.map((signal) => (
              <div key={signal.id} className="space-y-3">
                <SignalCard signal={signal} />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePublishSignal(signal.id)}
                    className="w-full rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-600"
                  >
                    PUBLISH
                  </button>

                  <button
                    onClick={() => handleDeleteSignal(signal.id)}
                    className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Published Signals</h3>
          <span className="text-xs text-zinc-400">
            Total Published: {publishedSignals.length}
          </span>
        </div>

        <div className="space-y-5">
          {publishedSignals.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
              No published signals available.
            </div>
          ) : (
            publishedSignals.map((signal) => (
              <div key={signal.id} className="space-y-3">
                <SignalCard signal={signal} />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleUnpublishSignal(signal.id)}
                    className="w-full rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/20"
                  >
                    UNPUBLISH
                  </button>

                  <button
                    onClick={() => handleDeleteSignal(signal.id)}
                    className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default function AdminPage() {
  const isClient = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getClientReadyServerSnapshot
  );

  if (!isClient) {
    return null;
  }

  return <AdminPageClient />;
}