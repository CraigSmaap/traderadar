"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Header from "@/components/layout/Header";
import LiveAlertsBar from "@/components/layout/LiveAlertsBar";
import SignalCard from "@/components/signals/SignalCard";
import FloatingTradeButton from "@/components/ui/FloatingTradeButton";
import { signals as initialSignals } from "@/data/signals";
import type { TradeSignal } from "@/lib/types";

type LiveNewsArticle = {
  title: string;
  description?: string;
  url?: string;
  source?: {
    id?: string | null;
    name?: string;
  };
  publishedAt?: string;
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

function formatPublishedTime(publishedAt?: string) {
  if (!publishedAt) return "Recently";

  const timestamp = new Date(publishedAt).getTime();

  if (Number.isNaN(timestamp)) {
    return "Recently";
  }

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

function getSignalSummary(signal: TradeSignal) {
  return signal.saImpact || signal.impact || signal.event;
}

function getPreviewReason(signal: TradeSignal) {
  if (signal.saImpact) return signal.saImpact;
  if (signal.impact) return signal.impact;
  return signal.event;
}

function getBiasDotClass(bias: TradeSignal["bias"]) {
  switch (bias) {
    case "Bullish":
      return "bg-emerald-400";
    case "Bearish":
      return "bg-red-400";
    case "Risk-Off":
      return "bg-amber-400";
    default:
      return "bg-zinc-400";
  }
}

function getBiasTextClass(bias: TradeSignal["bias"]) {
  switch (bias) {
    case "Bullish":
      return "text-emerald-300";
    case "Bearish":
      return "text-red-300";
    case "Risk-Off":
      return "text-amber-300";
    default:
      return "text-zinc-300";
  }
}

function getLivePreviewScore(signal: TradeSignal, index: number) {
  const confidenceBase =
    signal.confidence === "High" ? 84 : signal.confidence === "Medium" ? 74 : 66;

  const biasBonus =
    signal.bias === "Bullish" ? 4 : signal.bias === "Bearish" ? 3 : 2;

  const freshnessBonus = Math.max(0, 6 - index * 2);

  return Math.min(96, confidenceBase + biasBonus + freshnessBonus);
}

function HomeClient() {
  const publishedSignals = useMemo(() => {
    const storedSignals = getStoredSignals();

    return storedSignals
      .filter((signal) => signal.status === "published")
      .sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  const featuredSignal = publishedSignals[0];
  const quickSignals = publishedSignals.slice(1, 4);
  const livePreviewSignals = publishedSignals.slice(0, 3);

  const [news, setNews] = useState<LiveNewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news");
        const data = (await res.json()) as { articles?: LiveNewsArticle[] };
        setNews(Array.isArray(data.articles) ? data.articles : []);
      } catch (error) {
        console.error("News fetch failed:", error);
        setNews([]);
      } finally {
        setLoadingNews(false);
      }
    }

    fetchNews();
  }, []);

  const heroPanel =
    "overflow-hidden rounded-[32px] border border-zinc-800/90 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_30%),linear-gradient(135deg,rgba(24,24,27,0.96)_0%,rgba(10,10,12,0.97)_52%,rgba(6,6,8,0.99)_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_24px_70px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.05)]";

  const cardPanel =
    "rounded-[28px] border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(16,16,18,0.95)_0%,rgba(6,6,8,0.99)_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_40px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.04)]";

  const softPanel =
    "rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

  const statCard =
    "rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.28)]";

  return (
    <main className="min-h-screen bg-transparent text-white">
      <Header />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className={`mb-8 ${heroPanel}`}>
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-10">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                Trader intelligence for fast execution
              </div>

              <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Trade the headline. Then go Live for the real opportunities.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                TradeRadar helps South African traders scan market-moving
                headlines, understand likely impact fast, and move from idea to
                chart to execution with less friction.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/live"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.96)_0%,rgba(5,150,105,0.96)_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(16,185,129,0.22)] transition hover:brightness-110"
                >
                  View Live Opportunities
                </Link>

                <button
                  onClick={() =>
                    window.open("/api/redirect?asset=GLOBAL&type=trade", "_blank")
                  }
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-[linear-gradient(180deg,rgba(24,24,26,0.92)_0%,rgba(10,10,12,0.98)_100%)] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
                >
                  Trade with Exness
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className={statCard}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Active signals
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {publishedSignals.length}
                  </div>
                </div>

                <div className={statCard}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Data source
                  </div>
                  <div className="mt-2 text-lg font-semibold text-emerald-300">
                    News + Signals
                  </div>
                </div>

                <div className={statCard}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Execution
                  </div>
                  <div className="mt-2 text-lg font-semibold text-sky-300">
                    Execution-ready
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_36px_rgba(0,0,0,0.35)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Broker partner
                </div>

                <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                  Execution path
                </div>
              </div>

              <div className={`${softPanel} p-5`}>
                <div className="rounded-2xl border border-zinc-800/80 bg-black/50 px-4 py-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.32em] text-[#ffde59]">
                    EXNESS
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    Fast route from setup to broker
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Use TradeRadar to find the setup. Use Live to rank it. Use
                    the broker path to act cleanly.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-zinc-800/80 bg-black/40 px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      Workflow
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      Idea → Live → Chart
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-black/40 px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      Relevance
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      South Africa aware
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-black/40 px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      Action
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      Broker-ready flow
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    window.open("/api/redirect?asset=GLOBAL&type=trade", "_blank")
                  }
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-amber-400/10 bg-[linear-gradient(180deg,rgba(255,222,89,0.96)_0%,rgba(240,190,35,0.96)_100%)] px-4 py-3 text-sm font-bold text-black shadow-[0_10px_30px_rgba(240,190,35,0.18)] transition hover:brightness-110"
                >
                  Trade with Exness
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <LiveAlertsBar />
        </div>

        <div className={`mb-8 p-5 sm:p-6 ${cardPanel}`}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Market context
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-white">
                What traders are watching
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                Scan the headlines here, then open Live to see where the best
                ranked opportunities are forming.
              </p>
            </div>

            <Link
              href="/live"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
            >
              Go to Live →
            </Link>
          </div>

          {loadingNews ? (
            <div className="rounded-2xl border border-zinc-800/80 bg-black/30 px-4 py-6 text-sm text-zinc-500">
              Loading headlines...
            </div>
          ) : news.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800/80 bg-black/30 px-4 py-6 text-sm text-zinc-500">
              No market context available right now.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {news.slice(0, 3).map((article, index) => (
                <article
                  key={`${article.title}-${index}`}
                  className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-zinc-700"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {article.source?.name || "Market source"}
                    </div>

                    <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {formatPublishedTime(article.publishedAt)}
                    </div>
                  </div>

                  <h3 className="text-base font-semibold leading-7 text-white">
                    {article.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
                    {article.description ||
                      "Headline moving broader market attention."}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    {article.url && article.url !== "#" ? (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
                      >
                        Read source →
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-zinc-500">
                        Cached headline
                      </span>
                    )}

                    <Link
                      href="/live"
                      className="text-sm font-semibold text-sky-300 transition hover:text-sky-200"
                    >
                      Open Live
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {featuredSignal ? (
          <div className={`mb-8 p-5 sm:p-6 ${cardPanel}`}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Featured setup
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  One setup worth your attention
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Home gives context. Live gives ranking, comparison, and better
                  opportunity visibility.
                </p>
              </div>

              <Link
                href="/live"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
              >
                See ranked opportunities →
              </Link>
            </div>

            <SignalCard signal={featuredSignal} />
          </div>
        ) : null}

        <div className={`mb-8 p-5 sm:p-6 ${cardPanel}`}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300">
                Live preview
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Top opportunities pulling attention right now
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                This is only the preview. The full ranked board lives on the
                Live page.
              </p>
            </div>

            <Link
              href="/live"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.96)_0%,rgba(5,150,105,0.96)_100%)] px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(16,185,129,0.22)] transition hover:brightness-110"
            >
              View Live Opportunities
            </Link>
          </div>

          <div className="space-y-3">
            {livePreviewSignals.length > 0 ? (
              livePreviewSignals.map((signal, index) => {
                const primaryAsset = signal.assets[0] || "Market asset";
                const score = getLivePreviewScore(signal, index);

                return (
                  <div
                    key={signal.id}
                    className="flex flex-col gap-4 rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-black/40 text-sm font-bold text-white">
                        #{index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-white">
                            {primaryAsset}
                          </span>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getBiasTextClass(
                              signal.bias
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${getBiasDotClass(
                                signal.bias
                              )}`}
                            />
                            {signal.bias}
                          </span>
                        </div>

                        <div className="mt-1 text-sm text-zinc-400">
                          {signal.category} · {signal.region}
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">
                          {getPreviewReason(signal)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-right">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                          Edge preview
                        </div>
                        <div className="mt-1 text-lg font-semibold text-emerald-300">
                          {score}
                        </div>
                      </div>

                      <Link
                        href="/live"
                        className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
                      >
                        View Live
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-zinc-800/80 bg-black/30 px-4 py-6 text-sm text-zinc-500">
                No live preview opportunities available yet.
              </div>
            )}
          </div>
        </div>

        <div className={`mb-8 p-5 sm:p-6 ${cardPanel}`}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                Quick setups
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Fast scan ideas
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                Keep these light. The deeper ranking layer belongs on Live.
              </p>
            </div>

            <Link
              href="/live"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
            >
              Compare on Live →
            </Link>
          </div>

          {quickSignals.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {quickSignals.map((signal) => (
                <article
                  key={signal.id}
                  className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {signal.category}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold leading-tight text-white">
                        {signal.assets[0] || "Market setup"}
                      </h3>
                    </div>

                    <div
                      className={`rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getBiasTextClass(
                        signal.bias
                      )}`}
                    >
                      {signal.bias}
                    </div>
                  </div>

                  <div className="mb-3 text-sm text-zinc-400">
                    {signal.region} · {signal.confidence} confidence
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-zinc-300">
                    {getSignalSummary(signal)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {signal.assets.slice(0, 2).map((asset) => (
                      <span
                        key={asset}
                        className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
                      >
                        {asset}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      onClick={() =>
                        window.open("/api/redirect?asset=GLOBAL&type=trade", "_blank")
                      }
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.96)_0%,rgba(5,150,105,0.96)_100%)] px-4 py-2 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(16,185,129,0.18)] transition hover:brightness-110"
                    >
                      Trade
                    </button>

                    <Link
                      href="/live"
                      className="text-sm font-semibold text-sky-300 transition hover:text-sky-200"
                    >
                      Open Live →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800/80 bg-black/30 px-4 py-6 text-sm text-zinc-500">
              No quick setups available yet.
            </div>
          )}
        </div>

        <div className={`mb-8 p-5 sm:p-6 ${cardPanel}`}>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                What TradeRadar is
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-white">
                A fast market discovery layer built for traders
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400 sm:text-base">
                TradeRadar combines market context, trader-focused signal flow,
                and fast execution paths so users can move from attention to
                opportunity to action without wasting time.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className={`${softPanel} p-4`}>
                <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  Scan faster
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  See market-moving headlines quickly.
                </div>
              </div>

              <div className={`${softPanel} p-4`}>
                <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  See relevance
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  Understand why the move matters for SA traders.
                </div>
              </div>

              <div className={`${softPanel} p-4`}>
                <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  Execute cleaner
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  Move into Live, chart, and broker flow faster.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`mb-8 p-5 sm:p-6 ${cardPanel}`}>
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="rounded-[28px] border border-amber-500/20 bg-[linear-gradient(180deg,rgba(255,222,89,0.10)_0%,rgba(6,6,8,0.98)_100%)] p-5 shadow-[0_10px_30px_rgba(240,190,35,0.10)]">
              <div className="text-[11px] uppercase tracking-[0.18em] text-amber-300">
                Broker partner
              </div>

              <div className="mt-3 text-2xl font-black tracking-[0.18em] text-[#ffde59]">
                EXNESS
              </div>

              <div className="mt-3 text-sm leading-7 text-zinc-300">
                Open an account and act on TradeRadar setups faster through the
                broker partner path.
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-white">
                Ready to move from signal to execution?
              </h3>

              <p className="mt-3 text-sm leading-7 text-zinc-400 sm:text-base">
                Use Home to spot the story, open Live to compare the board, and
                use the partner flow when you are ready to execute.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/live"
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
                >
                  Go Live
                </Link>

                <button
                  onClick={() =>
                    window.open("/api/redirect?asset=GLOBAL&type=trade", "_blank")
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-amber-400/10 bg-[linear-gradient(180deg,rgba(255,222,89,0.96)_0%,rgba(240,190,35,0.96)_100%)] px-5 py-3 text-sm font-bold text-black shadow-[0_10px_30px_rgba(240,190,35,0.18)] transition hover:brightness-110"
                >
                  Trade with Exness
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FloatingTradeButton />
    </main>
  );
}

export default function Home() {
  const isClient = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getClientReadyServerSnapshot
  );

  if (!isClient) {
    return null;
  }

  return <HomeClient />;
}