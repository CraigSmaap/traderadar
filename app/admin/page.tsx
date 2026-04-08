"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Header from "@/components/layout/Header";
import { signals as initialSignals } from "@/data/signals";
import { convertNewsToSignal } from "@/lib/news";
import { fetchNews, type LiveNewsArticle } from "@/lib/fetchNews";
import type { ConfidenceLevel, SignalBias, TradeSignal } from "@/lib/types";

type TradeClick = {
  asset?: string;
  type: "trade" | "chart";
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

const defaultFetchStatus: FetchStatus = {
  fetched: 0,
  relevant: 0,
  added: 0,
  lastRun: null,
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

function getStoredFetchStatus(): FetchStatus {
  if (typeof window === "undefined") {
    return defaultFetchStatus;
  }

  const stored = window.localStorage.getItem("tradeRadarFetchStatus");

  if (!stored) {
    return defaultFetchStatus;
  }

  try {
    return JSON.parse(stored) as FetchStatus;
  } catch {
    return defaultFetchStatus;
  }
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

function formatTime(value: string | number | null | undefined) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function formatRelativeTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString();
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

function getClickTypeSummary(clicks: TradeClick[]) {
  let trade = 0;
  let chart = 0;

  for (const click of clicks) {
    if (click.type === "trade") trade++;
    if (click.type === "chart") chart++;
  }

  return { trade, chart };
}

function getTopCTA(clicks: TradeClick[]) {
  const { trade, chart } = getClickTypeSummary(clicks);

  if (trade === 0 && chart === 0) return "—";
  if (trade > chart) return "Trade";
  if (chart > trade) return "Chart";

  return "Equal";
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

function getCategorySummary(signals: TradeSignal[]) {
  const counts: Record<string, number> = {};

  for (const signal of signals) {
    counts[signal.category] = (counts[signal.category] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
}

function getTopClickedAsset(clicks: TradeClick[]) {
  const summary = getClickSummary(clicks);
  return summary[0]?.asset || "—";
}

function getDuplicateRate(fetchStatus: FetchStatus) {
  if (fetchStatus.relevant === 0) {
    return "0%";
  }

  const duplicates = fetchStatus.relevant - fetchStatus.added;
  const rate = Math.round((duplicates / fetchStatus.relevant) * 100);
  return `${rate}%`;
}

function getEngineStatus(fetchStatus: FetchStatus) {
  if (!fetchStatus.lastRun) {
    return "Waiting";
  }

  if (fetchStatus.fetched > 0 || fetchStatus.relevant > 0) {
    return "Running";
  }

  return "Idle";
}

function getSignalHealthLabel(signal: TradeSignal, clicks: TradeClick[]) {
  const assetSet = new Set(signal.assets);
  const relatedClicks = clicks.filter((click) =>
    click.asset ? assetSet.has(click.asset) : false
  ).length;

  if (relatedClicks >= 2) {
    return "Attention";
  }

  if (signal.confidence === "High") {
    return "Strong";
  }

  if (signal.confidence === "Low") {
    return "Weak";
  }

  return "Neutral";
}

function getHealthTone(status: string) {
  if (status === "Running") return "text-emerald-300";
  if (status === "Waiting") return "text-amber-300";
  return "text-zinc-300";
}

function Card({
  title,
  subtitle,
  children,
  rightNode,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightNode?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(20,20,22,0.94)_0%,rgba(7,7,9,0.98)_100%)] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_14px_40px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
          ) : null}
        </div>
        {rightNode}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "green" | "blue" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-300"
      : tone === "blue"
      ? "text-sky-300"
      : tone === "amber"
      ? "text-amber-300"
      : "text-white";

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(10,10,12,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.28)]">
      <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-800/70 py-3 last:border-b-0">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className={`text-sm font-medium text-white ${valueClassName || ""}`}>
        {value}
      </div>
    </div>
  );
}

function CompactSignalRow({
  signal,
  clicks,
}: {
  signal: TradeSignal;
  clicks: TradeClick[];
}) {
  const health = getSignalHealthLabel(signal, clicks);

  const healthClassName =
    health === "Attention"
      ? "text-emerald-300"
      : health === "Strong"
      ? "text-sky-300"
      : health === "Weak"
      ? "text-red-300"
      : "text-zinc-300";

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {signal.event}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {signal.category} · {signal.source} · {formatRelativeTime(signal.timestamp)}
          </div>
        </div>

        <div className={`shrink-0 text-xs font-semibold ${healthClassName}`}>
          {health}
        </div>
      </div>

      <div className="grid gap-2 text-xs text-zinc-400 sm:grid-cols-4">
        <div>
          <span className="block uppercase tracking-[0.14em] text-zinc-500">
            Bias
          </span>
          <span className="mt-1 block text-zinc-200">{signal.bias}</span>
        </div>
        <div>
          <span className="block uppercase tracking-[0.14em] text-zinc-500">
            Confidence
          </span>
          <span className="mt-1 block text-zinc-200">{signal.confidence}</span>
        </div>
        <div>
          <span className="block uppercase tracking-[0.14em] text-zinc-500">
            Region
          </span>
          <span className="mt-1 block text-zinc-200">{signal.region}</span>
        </div>
        <div>
          <span className="block uppercase tracking-[0.14em] text-zinc-500">
            Assets
          </span>
          <span className="mt-1 block truncate text-zinc-200">
            {signal.assets.join(", ") || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [signals, setSignals] = useState<TradeSignal[]>(() => getStoredSignals());
  const [clicks] = useState<TradeClick[]>(() => getStoredClicks());
  const [newSignal, setNewSignal] = useState<NewSignalForm>(defaultForm);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>(() =>
    getStoredFetchStatus()
  );
  const [fetching, setFetching] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  useEffect(() => {
    window.localStorage.setItem("tradeRadarSignals", JSON.stringify(signals));
  }, [signals]);

  useEffect(() => {
    window.localStorage.setItem(
      "tradeRadarFetchStatus",
      JSON.stringify(fetchStatus)
    );
  }, [fetchStatus]);

  const sortedSignals = useMemo(() => {
    return [...signals].sort((a, b) => b.timestamp - a.timestamp);
  }, [signals]);

  const publishedSignals = useMemo(() => {
    return sortedSignals.filter((signal) => signal.status === "published");
  }, [sortedSignals]);

  const draftSignals = useMemo(() => {
    return sortedSignals.filter((signal) => signal.status === "draft");
  }, [sortedSignals]);

  const clickSummary = useMemo(() => getClickSummary(clicks), [clicks]);
  const clickTypeSummary = useMemo(() => getClickTypeSummary(clicks), [clicks]);
  const topCTA = useMemo(() => getTopCTA(clicks), [clicks]);
  const sourceSummary = useMemo(() => getSourceSummary(signals), [signals]);
  const categorySummary = useMemo(() => getCategorySummary(signals), [signals]);

  const recentSignals = useMemo(() => sortedSignals.slice(0, 6), [sortedSignals]);
  const liveSignals = useMemo(() => publishedSignals.slice(0, 6), [publishedSignals]);

  const engineStatus = getEngineStatus(fetchStatus);
  const duplicateRate = getDuplicateRate(fetchStatus);
  const topClickedAsset = getTopClickedAsset(clicks);

  const inputClassName =
    "w-full rounded-2xl border border-zinc-800 bg-[linear-gradient(180deg,rgba(3,3,5,0.98)_0%,rgba(0,0,0,1)_100%)] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-500/70 focus:shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_0_6px_rgba(16,185,129,0.06)]";

  const handleFetchLiveNews = async () => {
    setFetching(true);

    try {
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
          lastRun: new Date().toISOString(),
        });

        return result.merged;
      });
    } catch (error) {
      console.error("Admin fetch live news error:", error);
      setFetchStatus((prev) => ({
        ...prev,
        lastRun: new Date().toISOString(),
      }));
    } finally {
      setFetching(false);
    }
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

    setSignals((prevSignals) => mergeUniqueSignals(prevSignals, [createdSignal]).merged);
    setNewSignal(defaultForm);
  };

  const handleDeleteSignal = (id: string) => {
    setSignals((prevSignals) => prevSignals.filter((signal) => signal.id !== id));
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
    <main className="min-h-screen bg-transparent text-white">
      <Header />

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-zinc-800/90 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_32%),linear-gradient(135deg,rgba(24,24,27,0.96)_0%,rgba(10,10,12,0.97)_48%,rgba(6,6,8,0.99)_100%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_50px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                Dashboard
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-white">
                TradeRadar Admin
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Clean operating view for system health, user attention, signal
                quality, and light-touch overrides.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleFetchLiveNews}
                disabled={fetching}
                className="rounded-2xl border border-sky-400/20 bg-[linear-gradient(180deg,rgba(59,130,246,0.96)_0%,rgba(37,99,235,0.96)_100%)] px-4 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(37,99,235,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {fetching ? "FETCHING..." : "FETCH NOW"}
              </button>

              <button
                onClick={() => setShowAdvancedTools((prev) => !prev)}
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
              >
                {showAdvancedTools ? "HIDE ADVANCED" : "SHOW ADVANCED"}
              </button>

              <button
                onClick={onLogout}
                className="rounded-2xl border border-red-500/20 bg-[linear-gradient(180deg,rgba(127,29,29,0.16)_0%,rgba(69,10,10,0.2)_100%)] px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
              >
                LOG OUT
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            label="Engine Status"
            value={engineStatus}
            tone={engineStatus === "Running" ? "green" : "amber"}
          />
          <StatCard label="Last Fetch" value={fetchStatus.lastRun ? "OK" : "—"} tone="blue" />
          <StatCard label="Signals Generated" value={signals.length} />
          <StatCard label="Live Signals" value={publishedSignals.length} tone="green" />
          <StatCard label="Clicks" value={clicks.length} tone="blue" />
          <StatCard label="Trade Clicks" value={clickTypeSummary.trade} tone="green" />
          <StatCard label="Chart Clicks" value={clickTypeSummary.chart} />
          <StatCard label="Top CTA" value={topCTA} tone="amber" />
          <StatCard label="Top Asset" value={topClickedAsset} tone="amber" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card
              title="System Health"
              subtitle="Operational view of fetch quality and signal intake."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-3">
                  <MetricRow
                    label="Engine"
                    value={engineStatus}
                    valueClassName={getHealthTone(engineStatus)}
                  />
                  <MetricRow label="Last fetch run" value={formatTime(fetchStatus.lastRun)} />
                  <MetricRow label="Articles fetched" value={fetchStatus.fetched} />
                  <MetricRow label="Relevant signals" value={fetchStatus.relevant} />
                  <MetricRow label="Newly added" value={fetchStatus.added} />
                  <MetricRow label="Duplicate rate" value={duplicateRate} />
                </div>

                <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-3">
                  <MetricRow label="Total signals" value={signals.length} />
                  <MetricRow label="Live signals" value={publishedSignals.length} />
                  <MetricRow label="Draft signals" value={draftSignals.length} />
                  <MetricRow label="Tracked clicks" value={clicks.length} />
                  <MetricRow label="Top clicked asset" value={topClickedAsset} />
                  <MetricRow
                    label="Source leader"
                    value={sourceSummary[0]?.source || "—"}
                  />
                </div>
              </div>
            </Card>

            <Card
              title="Signal Quality"
              subtitle="Compact inspection of what the engine is producing."
            >
              <div className="space-y-4">
                {recentSignals.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] p-4 text-sm text-zinc-500">
                    No signals available yet.
                  </div>
                ) : (
                  recentSignals.map((signal) => (
                    <CompactSignalRow
                      key={signal.id}
                      signal={signal}
                      clicks={clicks}
                    />
                  ))
                )}
              </div>
            </Card>

            <Card
              title="Quick Overrides"
              subtitle="Intervene without turning admin into another feed page."
            >
              <div className="space-y-4">
                {liveSignals.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] p-4 text-sm text-zinc-500">
                    No live signals available.
                  </div>
                ) : (
                  liveSignals.map((signal) => (
                    <div
                      key={signal.id}
                      className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-4"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">
                            {signal.event}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {signal.category} · {signal.assets.join(", ") || "—"}
                          </div>
                        </div>

                        <div className="shrink-0 text-xs text-zinc-400">
                          {formatRelativeTime(signal.timestamp)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleUnpublishSignal(signal.id)}
                          className="w-full rounded-2xl border border-yellow-500/20 bg-[linear-gradient(180deg,rgba(120,53,15,0.18)_0%,rgba(69,26,3,0.22)_100%)] px-4 py-3 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/20"
                        >
                          UNPUBLISH
                        </button>

                        <button
                          onClick={() => handleDeleteSignal(signal.id)}
                          className="w-full rounded-2xl border border-red-500/20 bg-[linear-gradient(180deg,rgba(127,29,29,0.16)_0%,rgba(69,10,10,0.2)_100%)] px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card
              title="User Attention"
              subtitle="What users are actually showing interest in."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-3">

                 {/* 🔥 CTA PERFORMANCE */}
              <div className="mb-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                                  CTA Performance
              </div>

                <MetricRow
                  label="Trade Clicks"
                   value={clickTypeSummary.trade}
                  valueClassName="text-emerald-300"
                     />

                 <MetricRow
                  label="Chart Clicks"
                   value={clickTypeSummary.chart}
                   valueClassName="text-sky-300"
                   />

                  <MetricRow
                   label="Top CTA"
                   value={topCTA}
                   valueClassName="text-amber-300"
                    />
                  </div>

                  {/* ORIGINAL */}
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                   Top Clicked Assets
                   </div>

                  {clickSummary.length === 0 ? (
                    <div className="py-2 text-sm text-zinc-500">
                      No click data yet.
                    </div>
                  ) : (
                    clickSummary.slice(0, 6).map((item) => (
                      <MetricRow
                        key={item.asset}
                        label={item.asset}
                        value={`${item.total} clicks`}
                        valueClassName="text-emerald-300"
                      />
                    ))
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-3">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Recent Click Activity
                  </div>

                  {clicks.length === 0 ? (
                    <div className="py-2 text-sm text-zinc-500">
                      No click activity yet.
                    </div>
                  ) : (
                    clicks
                      .slice()
                      .reverse()
                      .slice(0, 6)
                      .map((click, index) => (
                        <MetricRow
                          key={`${click.time}-${index}`}
                          label={click.asset || "Unknown"}
                          value={formatTime(click.time)}
                        />
                      ))
                  )}
                </div>
              </div>
            </Card>

            <Card
              title="Signal Mix"
              subtitle="What categories and sources are dominating output."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-3">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    By Source
                  </div>

                  {sourceSummary.length === 0 ? (
                    <div className="py-2 text-sm text-zinc-500">
                      No source data yet.
                    </div>
                  ) : (
                    sourceSummary.map((item) => (
                      <MetricRow
                        key={item.source}
                        label={item.source}
                        value={item.total}
                        valueClassName="text-sky-300"
                      />
                    ))
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-3">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Top Categories
                  </div>

                  {categorySummary.length === 0 ? (
                    <div className="py-2 text-sm text-zinc-500">
                      No category data yet.
                    </div>
                  ) : (
                    categorySummary.map((item) => (
                      <MetricRow
                        key={item.category}
                        label={item.category}
                        value={item.total}
                        valueClassName="text-amber-300"
                      />
                    ))
                  )}
                </div>
              </div>
            </Card>

            {showAdvancedTools ? (
              <Card
                title="Advanced Tools"
                subtitle="Secondary tools for manual intervention and emergency inserts."
              >
                <div className="space-y-6">
                  <div>
                    <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Manual Signal Creator
                    </div>

                    <div className="grid gap-3">
                      <input
                        type="text"
                        placeholder="Category (e.g. FED SIGNAL)"
                        className={inputClassName}
                        value={newSignal.category}
                        onChange={(e) =>
                          setNewSignal({ ...newSignal, category: e.target.value })
                        }
                      />

                      <textarea
                        placeholder="Event"
                        rows={3}
                        className={inputClassName}
                        value={newSignal.event}
                        onChange={(e) =>
                          setNewSignal({ ...newSignal, event: e.target.value })
                        }
                      />

                      <textarea
                        placeholder="Market Impact"
                        rows={3}
                        className={inputClassName}
                        value={newSignal.impact}
                        onChange={(e) =>
                          setNewSignal({ ...newSignal, impact: e.target.value })
                        }
                      />

                      <textarea
                        placeholder="SA Impact"
                        rows={3}
                        className={inputClassName}
                        value={newSignal.saImpact}
                        onChange={(e) =>
                          setNewSignal({ ...newSignal, saImpact: e.target.value })
                        }
                      />

                      <input
                        type="text"
                        placeholder="Assets to Watch (comma separated)"
                        className={inputClassName}
                        value={newSignal.assets}
                        onChange={(e) =>
                          setNewSignal({ ...newSignal, assets: e.target.value })
                        }
                      />

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <select
                          className={inputClassName}
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
                          className={inputClassName}
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
                        className={inputClassName}
                        value={newSignal.tradeUrl}
                        onChange={(e) =>
                          setNewSignal({ ...newSignal, tradeUrl: e.target.value })
                        }
                      />

                      <button
                        onClick={handleAddSignal}
                        className="mt-1 w-full rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.96)_0%,rgba(5,150,105,0.96)_100%)] px-4 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(16,185,129,0.22)] transition hover:brightness-110"
                      >
                        ADD DRAFT SIGNAL
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Draft Queue
                    </div>

                    <div className="space-y-3">
                      {draftSignals.length === 0 ? (
                        <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] p-4 text-sm text-zinc-500">
                          No draft signals available.
                        </div>
                      ) : (
                        draftSignals.slice(0, 6).map((signal) => (
                          <div
                            key={signal.id}
                            className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-4"
                          >
                            <div className="mb-3 text-sm font-semibold text-white">
                              {signal.event}
                            </div>

                            <div className="mb-4 text-xs text-zinc-500">
                              {signal.category} · {signal.assets.join(", ") || "—"}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => handlePublishSignal(signal.id)}
                                className="w-full rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.96)_0%,rgba(5,150,105,0.96)_100%)] px-4 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition hover:brightness-110"
                              >
                                PUBLISH
                              </button>

                              <button
                                onClick={() => handleDeleteSignal(signal.id)}
                                className="w-full rounded-2xl border border-red-500/20 bg-[linear-gradient(180deg,rgba(127,29,29,0.16)_0%,rgba(69,10,10,0.2)_100%)] px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                              >
                                DELETE
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.sessionStorage.getItem("admin-auth") === "true";
  });

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const adminPassword =
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "traderadar123";

  const handleLogin = () => {
    if (password === adminPassword) {
      window.sessionStorage.setItem("admin-auth", "true");
      setIsAuthenticated(true);
      setError("");
      return;
    }

    setError("Incorrect password");
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem("admin-auth");
    setIsAuthenticated(false);
    setPassword("");
    setError("");
  };

  if (!isClient) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Header />
        <section className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800/90 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_30%),linear-gradient(180deg,rgba(16,16,18,0.96)_0%,rgba(6,6,8,0.99)_100%)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_50px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="mb-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Restricted Area
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Admin Access
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Enter the admin password to access TradeRadar monitoring,
              analytics, and override tools.
            </p>

            <div className="mt-5 space-y-3">
              <input
                type="password"
                placeholder="Enter password"
                className="w-full rounded-2xl border border-zinc-800 bg-[linear-gradient(180deg,rgba(3,3,5,0.98)_0%,rgba(0,0,0,1)_100%)] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-500/70 focus:shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_0_6px_rgba(16,185,129,0.06)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
              />

              {error ? (
                <p className="text-sm text-red-400">{error}</p>
              ) : null}

              <button
                onClick={handleLogin}
                className="w-full rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.96)_0%,rgba(5,150,105,0.96)_100%)] px-4 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(16,185,129,0.22)] transition hover:brightness-110"
              >
                Unlock Admin
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}