"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
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

type MixedAlertItem =
  | {
      id: string;
      kind: "signal";
      title: string;
      sourceLabel: string;
      badgeLabel: string;
      badgeClass: string;
      footerTags: string[];
      subLabel: string;
      href?: string;
    }
  | {
      id: string;
      kind: "news";
      title: string;
      sourceLabel: string;
      badgeLabel: string;
      badgeClass: string;
      footerTags: string[];
      subLabel: string;
      href?: string;
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

function getBiasStyles(bias: TradeSignal["bias"]) {
  switch (bias) {
    case "Bullish":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "Bearish":
      return "border-red-500/20 bg-red-500/10 text-red-300";
    case "Risk-Off":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    default:
      return "border-zinc-800 bg-zinc-900 text-zinc-300";
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

function formatSignalTime(timestamp: number) {
  if (!timestamp) return "Recent";

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return "Earlier";
}

function LiveAlertsBarClient() {
  const [news, setNews] = useState<LiveNewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      try {
        const res = await fetch("/api/news");
        const data = (await res.json()) as { articles?: LiveNewsArticle[] };

        if (!isMounted) {
          return;
        }

        setNews(Array.isArray(data.articles) ? data.articles : []);
      } catch (error) {
        console.error("LiveAlertsBar news fetch failed:", error);

        if (!isMounted) {
          return;
        }

        setNews([]);
      } finally {
        if (isMounted) {
          setLoadingNews(false);
        }
      }
    }

    loadNews();

    return () => {
      isMounted = false;
    };
  }, []);

  const mixedItems = useMemo<MixedAlertItem[]>(() => {
    const signals = getStoredSignals();

    const latestPublishedSignals = [...signals]
      .filter((signal) => signal.status === "published")
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 2)
      .map((signal) => ({
        id: `signal-${signal.id}`,
        kind: "signal" as const,
        title: signal.event,
        sourceLabel: signal.source.toUpperCase(),
        badgeLabel: signal.bias,
        badgeClass: getBiasStyles(signal.bias),
        footerTags: signal.assets.slice(0, 2),
        subLabel: `${signal.category} · ${formatSignalTime(signal.timestamp)}`,
      }));

    const latestNews = [...news]
      .filter((article) => typeof article.title === "string" && article.title.trim().length > 0)
      .slice(0, 2)
      .map((article, index) => ({
        id: `news-${index}-${article.title}`,
        kind: "news" as const,
        title: article.title,
        sourceLabel: (article.source?.name || "MARKET NEWS").toUpperCase(),
        badgeLabel: "Headline",
        badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-300",
        footerTags: [formatPublishedTime(article.publishedAt)],
        subLabel: `News context · ${formatPublishedTime(article.publishedAt)}`,
        href: article.url && article.url !== "#" ? article.url : undefined,
      }));

    return [...latestPublishedSignals, ...latestNews].slice(0, 4);
  }, [news]);

  if (loadingNews && mixedItems.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
        Loading market alerts...
      </div>
    );
  }

  if (mixedItems.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
        No active market alerts available right now.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300">
            Market alert stream
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">
            Fresh headlines and active signals
          </h3>
        </div>

        <div className="rounded-full border border-zinc-800 bg-black/40 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-zinc-400">
          {mixedItems.length} items
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        {mixedItems.map((item) => {
          const content = (
            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4 transition hover:border-zinc-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {item.sourceLabel}
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${item.badgeClass}`}
                >
                  {item.badgeLabel}
                </span>
              </div>

              <div className="line-clamp-2 text-sm font-semibold leading-6 text-white">
                {item.title}
              </div>

              <div className="mt-2 text-xs text-zinc-500">
                {item.subLabel}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {item.footerTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );

          if (item.kind === "news" && item.href) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {content}
              </a>
            );
          }

          return <div key={item.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}

export default function LiveAlertsBar() {
  const isClient = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getClientReadyServerSnapshot
  );

  if (!isClient) {
    return null;
  }

  return <LiveAlertsBarClient />;
}