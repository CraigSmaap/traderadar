"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Header from "@/components/layout/Header";
import FloatingTradeButton from "@/components/ui/FloatingTradeButton";
import { signals as initialSignals } from "@/data/signals";
import { convertNewsToSignal } from "@/lib/news";
import { fetchNews, type LiveNewsArticle } from "@/lib/fetchNews";
import type { MarketSnapshot } from "@/lib/market";
import Link from "next/link";
import {
  clampEdgeScore,
  deriveSetupStrengthFromTotal,
  getBehaviorScore,
  getLatestBias,
  getNewsScore,
  getRecencyScore,
  getSignalScore,
  getStrongestConfidence,
  getTechnicalScore,
} from "@/lib/edge";

import type {
  ConfidenceLevel,
  SignalBias,
  TradeCall,
  SetupStrength,
  TradeSignal,
  LiveAsset,
  TradeClick,
  RankedAsset,
} from "@/lib/types";

type MarketApiResponse = {
  ok: boolean;
  snapshots: MarketSnapshot[];
  updatedAt: number;
};

const liveAssets: LiveAsset[] = [
  {
    id: "j200",
    name: "JSE Top 40",
    symbol: "J200",
    market: "South Africa",
    focus: "Index / momentum",
    reason: "Benchmark for broad South African equity intraday direction.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3AJ200",
  },
  {
    id: "npn",
    name: "Naspers",
    symbol: "NPN",
    market: "South Africa",
    focus: "High-liquidity equity",
    reason: "One of the most actively watched JSE names for volume and momentum.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3ANPN",
  },
  {
    id: "prx",
    name: "Prosus",
    symbol: "PRX",
    market: "South Africa",
    focus: "Tech-linked large cap",
    reason: "Major index mover with strong sentiment spillover into the broader JSE.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3APRX",
  },
  {
    id: "agl",
    name: "Anglo American",
    symbol: "AGL",
    market: "South Africa",
    focus: "Mining / macro sensitivity",
    reason: "Useful for commodities-driven intraday moves and macro sentiment.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3AAGL",
  },
  {
    id: "bhg",
    name: "BHP Group",
    symbol: "BHG",
    market: "South Africa",
    focus: "Resource heavyweight",
    reason: "Large resource name closely tied to global commodity tone.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3ABHG",
  },
  {
    id: "gfi",
    name: "Gold Fields",
    symbol: "GFI",
    market: "South Africa",
    focus: "Gold sensitivity",
    reason: "High relevance when gold breaks or risk-off positioning builds.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3AGFI",
  },
  {
    id: "har",
    name: "Harmony Gold",
    symbol: "HAR",
    market: "South Africa",
    focus: "Gold beta",
    reason: "Often reacts strongly to bullion momentum and defensive flows.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3AHAR",
  },
  {
    id: "sol",
    name: "Sasol",
    symbol: "SOL",
    market: "South Africa",
    focus: "Energy / rand sensitivity",
    reason: "Important for oil-linked moves and South African macro reaction.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3ASOL",
  },
  {
    id: "mtn",
    name: "MTN Group",
    symbol: "MTN",
    market: "South Africa",
    focus: "Large-cap telecom",
    reason: "Widely followed large-cap name with broad retail and institutional attention.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3AMTN",
  },
  {
    id: "vod",
    name: "Vodacom",
    symbol: "VOD",
    market: "South Africa",
    focus: "Defensive telecom",
    reason: "Useful for rotation checks when traders move toward defensives.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3AVOD",
  },
  {
    id: "shp",
    name: "Shoprite",
    symbol: "SHP",
    market: "South Africa",
    focus: "Consumer leader",
    reason: "Good read on defensive consumer strength inside the JSE.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3ASHP",
  },
  {
    id: "fsr",
    name: "FirstRand",
    symbol: "FSR",
    market: "South Africa",
    focus: "Banking / local macro",
    reason: "Important bank for local growth, rates, and risk appetite monitoring.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3AFSR",
  },
  {
    id: "sbk",
    name: "Standard Bank",
    symbol: "SBK",
    market: "South Africa",
    focus: "Banking / rates",
    reason: "Useful for local rates sensitivity and banking sector tone.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3ASBK",
  },
  {
    id: "abg",
    name: "Absa Group",
    symbol: "ABG",
    market: "South Africa",
    focus: "Banking / local risk",
    reason: "Adds depth to bank-watch when financials are driving the tape.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3AABG",
  },
  {
    id: "ned",
    name: "Nedbank",
    symbol: "NED",
    market: "South Africa",
    focus: "Banking / domestic macro",
    reason: "Helps round out JSE financials when domestic themes dominate.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=JSE%3ANED",
  },
  {
    id: "xauusd",
    name: "Gold Spot",
    symbol: "XAUUSD",
    market: "Global / SA relevance",
    focus: "Risk / safe-haven",
    reason: "Key macro hedge watched closely by SA traders and miners.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD",
  },
  {
    id: "usdzar",
    name: "USD / ZAR",
    symbol: "USDZAR",
    market: "South Africa FX",
    focus: "Rand volatility",
    reason: "Critical macro execution pair for SA-focused traders.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=OANDA%3AUSDZAR",
  },
  {
    id: "eurusd",
    name: "EUR / USD",
    symbol: "EURUSD",
    market: "Forex",
    focus: "Major FX pair",
    reason: "Global benchmark for USD direction and macro flows.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=OANDA%3AEURUSD",
  },
  {
    id: "gbpusd",
    name: "GBP / USD",
    symbol: "GBPUSD",
    market: "Forex",
    focus: "High volatility FX",
    reason: "Sensitive to macro shifts and often produces strong intraday moves.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=OANDA%3AGBPUSD",
  },
  {
    id: "spx",
    name: "S&P 500",
    symbol: "SPX",
    market: "US Indices",
    focus: "Global risk benchmark",
    reason: "Primary global risk sentiment driver for equities and macro positioning.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=SP%3ASPX",
  },
  {
    id: "nasdaq",
    name: "NASDAQ 100",
    symbol: "NASDAQ",
    market: "US Indices",
    focus: "Tech momentum",
    reason: "Leads global tech sentiment and high-beta equity moves.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=NASDAQ%3ANDX",
  },
  {
    id: "oil",
    name: "Crude Oil (WTI)",
    symbol: "OIL",
    market: "Commodities",
    focus: "Energy macro driver",
    reason: "Key driver of inflation expectations and global macro flows.",
    chartUrl: "https://www.tradingview.com/chart/?symbol=TVC%3AUSOIL",
  },
];

const assetAliasMap: Record<string, string[]> = {
  J200: ["J200", "TOP40", "TOP 40", "JSE TOP 40", "JSE40", "TOP-40", "INDEX"],
  NPN: ["NPN", "NASPERS"],
  PRX: ["PRX", "PROSUS"],
  AGL: ["AGL", "ANGLO AMERICAN", "ANGLO"],
  BHG: ["BHG", "BHP", "BHP GROUP"],
  GFI: ["GFI", "GOLD FIELDS"],
  HAR: ["HAR", "HARMONY", "HARMONY GOLD"],
  SOL: ["SOL", "SASOL"],
  MTN: ["MTN", "MTN GROUP"],
  VOD: ["VOD", "VODACOM"],
  SHP: ["SHP", "SHOPRITE"],
  FSR: ["FSR", "FIRSTRAND", "FIRST RAND"],
  SBK: ["SBK", "STANDARD BANK"],
  ABG: ["ABG", "ABSA", "ABSA GROUP"],
  NED: ["NED", "NEDBANK"],
  XAUUSD: ["XAUUSD", "XAU/USD", "GOLD", "GOLD SPOT", "BULLION"],
  USDZAR: ["USDZAR", "USD/ZAR", "USD ZAR", "RAND", "ZAR", "DOLLAR/RAND"],
  EURUSD: ["EURUSD", "EUR/USD", "EURO DOLLAR"],
  GBPUSD: ["GBPUSD", "GBP/USD", "POUND DOLLAR"],
  SPX: ["SPX", "S&P", "S&P 500", "SP500"],
  NASDAQ: ["NASDAQ", "NDX", "NASDAQ 100"],
  OIL: ["OIL", "WTI", "CRUDE", "USOIL"],
};

const groupedAliasMap: Record<string, string[]> = {
  BANKS: ["FSR", "SBK", "ABG", "NED"],
  "SA BANKS": ["FSR", "SBK", "ABG", "NED"],
  MINERS: ["AGL", "BHG", "GFI", "HAR"],
  GOLD: ["XAUUSD", "GFI", "HAR"],
  COMMODITIES: ["AGL", "BHG", "SOL", "XAUUSD", "OIL"],
  ENERGY: ["SOL", "OIL"],
  TELECOMS: ["MTN", "VOD"],
  DEFENSIVES: ["VOD", "SHP"],
  TECH: ["NPN", "PRX", "NASDAQ"],
  "USD/ZAR": ["USDZAR"],
  USDZAR: ["USDZAR"],
  "TOP 40": ["J200"],
  "JSE TOP 40": ["J200"],
  FOREX: ["USDZAR", "EURUSD", "GBPUSD"],
  INDICES: ["J200", "SPX", "NASDAQ"],
};

function normalizeAssetKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function assetMatchesWatchlistSymbol(signalAsset: string, watchlistSymbol: string) {
  const normalizedSignalAsset = normalizeAssetKey(signalAsset);
  const normalizedSymbol = normalizeAssetKey(watchlistSymbol);

  if (normalizedSignalAsset === normalizedSymbol) {
    return true;
  }

  const aliases = assetAliasMap[normalizedSymbol] || [];
  if (aliases.some((alias) => normalizeAssetKey(alias) === normalizedSignalAsset)) {
    return true;
  }

  const expandedSymbols = groupedAliasMap[normalizedSignalAsset];
  if (expandedSymbols?.includes(normalizedSymbol)) {
    return true;
  }

  return false;
}

function buildRecommendation(
  tradeCall: TradeCall,
  setupStrength: SetupStrength,
  confidence: ConfidenceLevel | "Low",
  signalCount: number,
  clickCount: number,
  technicalScore: number,
  edgeScoreTotal: number
) {
  if (edgeScoreTotal >= 75) {
    if (tradeCall === "LONG") {
      return "High-priority long setup with strong momentum and active market participation.";
    }

    if (tradeCall === "SHORT") {
      return "High-priority short setup with strong downside pressure and active selling.";
    }

    return "Top-tier active setup — strong market movement is creating immediate opportunity.";
  }

  if (technicalScore >= 24) {
    if (tradeCall === "LONG") {
      return "Strong bullish momentum — technical movement is driving opportunity right now.";
    }

    if (tradeCall === "SHORT") {
      return "Strong bearish momentum — downside movement is actively tradable.";
    }

    return "Strong technical movement — asset is active and worth immediate attention.";
  }

  if (setupStrength === "Strong") {
    if (tradeCall === "LONG" && confidence === "High") {
      return "Strong bullish structure with high conviction — priority long focus.";
    }

    if (tradeCall === "SHORT" && confidence === "High") {
      return "Strong bearish structure with high conviction — priority short focus.";
    }

    return "Strong setup quality — remains a high-priority watch.";
  }

  if (setupStrength === "Moderate") {
    if (technicalScore >= 12) {
      return "Market activity is building — setup is improving and worth monitoring.";
    }

    if (tradeCall === "LONG") {
      return "Bullish setup forming — watch for continuation.";
    }

    if (tradeCall === "SHORT") {
      return "Bearish setup forming — watch for downside continuation.";
    }

    return "Moderate setup — requires further confirmation.";
  }

  if (technicalScore >= 10) {
    return "Active movement detected — setup is not fully confirmed yet but tradable conditions may develop.";
  }

  if (clickCount >= 3 && signalCount >= 2) {
    return "Trader attention is rising, but confirmation is still developing.";
  }

  if (signalCount === 0 && clickCount === 0 && technicalScore === 0) {
    return "Low activity — no strong signals or movement at the moment.";
  }

  return "Watch for alignment between signals, momentum, and conviction.";
}

function deriveTradeCall(
  bias: SignalBias | "Neutral",
  confidence: ConfidenceLevel | "Low",
  signalCount: number,
  clickCount: number,
  technicalScore: number,
  marketSnapshot?: {
    trend?: "UP" | "DOWN" | "FLAT";
    opportunity?: "BREAKOUT" | "BREAKDOWN" | "TRENDING" | "RANGING" | "NONE";
  } | null
): "LONG" | "SHORT" | "DEFENSIVE" | "WATCH" {
  if (marketSnapshot) {
    if (
      marketSnapshot.opportunity === "BREAKDOWN" ||
      (marketSnapshot.trend === "DOWN" && technicalScore >= 18)
    ) {
      return "SHORT";
    }

    if (
      marketSnapshot.opportunity === "BREAKOUT" ||
      (marketSnapshot.trend === "UP" && technicalScore >= 18)
    ) {
      return "LONG";
    }
  }

  if (bias === "Bullish" && confidence === "High" && signalCount >= 2) {
    return "LONG";
  }

  if (bias === "Bearish" && confidence === "High" && signalCount >= 2) {
    return "SHORT";
  }

  if (bias === "Risk-Off") {
    if (signalCount >= 2 && confidence !== "Low") {
      return "LONG";
    }

    return "DEFENSIVE";
  }

  if (technicalScore >= 12) {
    if (marketSnapshot?.trend === "DOWN") {
      return "SHORT";
    }

    if (marketSnapshot?.trend === "UP") {
      return "LONG";
    }

    return "WATCH";
  }

  if (clickCount >= 2) {
    return "WATCH";
  }

  return "WATCH";
}

function getBiasStyles(bias: SignalBias | "Neutral") {
  if (bias === "Bullish") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (bias === "Bearish") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  if (bias === "Risk-Off") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-zinc-700 bg-zinc-900/80 text-zinc-300";
}

function getTradeCallStyles(call: "LONG" | "SHORT" | "DEFENSIVE" | "WATCH") {
  if (call === "LONG") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (call === "SHORT") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (call === "DEFENSIVE") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return "border-zinc-700 bg-zinc-900/80 text-zinc-400";
}

function getSetupStrengthStyles(strength: SetupStrength) {
  if (strength === "Strong") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (strength === "Moderate") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-zinc-700 bg-zinc-900/80 text-zinc-300";
}

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

export default function LivePage() {
  const isClient = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getClientReadyServerSnapshot
  );

  const [now, setNow] = useState(() => Date.now());
  const [newsSignals, setNewsSignals] = useState<TradeSignal[]>([]);
  const [marketSnapshots, setMarketSnapshots] = useState<MarketSnapshot[]>([]);

  const signals = useMemo<TradeSignal[]>(() => {
    if (!isClient) {
      return initialSignals;
    }

    try {
      const storedSignals = window.localStorage.getItem("tradeRadarSignals");

      if (!storedSignals) {
        return initialSignals;
      }

      const parsedSignals = JSON.parse(storedSignals) as TradeSignal[];
      return Array.isArray(parsedSignals) && parsedSignals.length > 0
        ? parsedSignals
        : initialSignals;
    } catch {
      return initialSignals;
    }
  }, [isClient]);

  const clicks = useMemo<TradeClick[]>(() => {
    if (!isClient) {
      return [];
    }

    try {
      const storedClicks = window.localStorage.getItem("tradeClicks");

      if (!storedClicks) {
        return [];
      }

      const parsedClicks = JSON.parse(storedClicks) as TradeClick[];
      return Array.isArray(parsedClicks) ? parsedClicks : [];
    } catch {
      return [];
    }
  }, [isClient]);

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadNews = async () => {
      if (isFetching) {
        return;
      }

      isFetching = true;

      try {
        const articles: LiveNewsArticle[] = await fetchNews();

        const converted = articles
          .map((article) =>
            convertNewsToSignal({
              title: article.title,
              region: article.source?.name || "Global",
              category: "LIVE NEWS",
            })
          )
          .filter((s): s is TradeSignal => s !== null);

        if (!isMounted) {
          return;
        }

        setNewsSignals(converted);
      } catch (err) {
        console.error("Live news load failed:", err);
      } finally {
        isFetching = false;
      }
    };

    loadNews();

    intervalId = setInterval(() => {
      loadNews();
      setNow(Date.now());
    }, 25 * 60 * 1000);

    return () => {
      isMounted = false;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadMarket = async () => {
      if (isFetching) {
        return;
      }

      isFetching = true;

      try {
        const response = await fetch("/api/market", {
          method: "GET",
          cache: "default",
        });

        if (!response.ok) {
          throw new Error(`Market request failed: ${response.status}`);
        }

        const data = (await response.json()) as MarketApiResponse;

        if (!isMounted) {
          return;
        }

        setMarketSnapshots(Array.isArray(data.snapshots) ? data.snapshots : []);
      } catch (err) {
        console.error("Live market load failed:", err);
      } finally {
        isFetching = false;
      }
    };

    loadMarket();

    intervalId = setInterval(() => {
      loadMarket();
      setNow(Date.now());
    }, 25 * 60 * 1000);

    return () => {
      isMounted = false;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const publishedSignals = useMemo(() => {
    const combined = [...signals, ...newsSignals];
    return combined.sort((a, b) => b.timestamp - a.timestamp);
  }, [signals, newsSignals]);

  const marketSnapshotMap = useMemo(() => {
    const map = new Map<string, MarketSnapshot>();

    for (const snapshot of marketSnapshots) {
      map.set(snapshot.symbol, snapshot);
    }

    return map;
  }, [marketSnapshots]);

  const rankedAssets = useMemo<RankedAsset[]>(() => {
    const totalClickCounts = new Map<string, number>();
    const tradeClickCounts = new Map<string, number>();
    const chartClickCounts = new Map<string, number>();

    for (const click of clicks) {
      const assetKey = normalizeAssetKey(click.asset || "UNKNOWN");

      for (const asset of liveAssets) {
        if (assetMatchesWatchlistSymbol(assetKey, asset.symbol)) {
          totalClickCounts.set(
            asset.symbol,
            (totalClickCounts.get(asset.symbol) || 0) + 1
          );

          if (click.type === "trade") {
            tradeClickCounts.set(
              asset.symbol,
              (tradeClickCounts.get(asset.symbol) || 0) + 1
            );
          }

          if (click.type === "chart") {
            chartClickCounts.set(
              asset.symbol,
              (chartClickCounts.get(asset.symbol) || 0) + 1
            );
          }
        }
      }
    }

    return liveAssets
      .map((asset): RankedAsset => {
        const relatedSignals = publishedSignals.filter((signal) =>
          signal.assets.some((signalAsset) =>
            assetMatchesWatchlistSymbol(signalAsset, asset.symbol)
          )
        );

        const signalCount = relatedSignals.length;
        const clickCount = totalClickCounts.get(asset.symbol) || 0;
        const tradeClickCount = tradeClickCounts.get(asset.symbol) || 0;
        const chartClickCount = chartClickCounts.get(asset.symbol) || 0;

        const latestBias = getLatestBias(relatedSignals);
        const strongestConfidence = getStrongestConfidence(relatedSignals);

        const signalScore = getSignalScore(relatedSignals);
        const recencyScore = getRecencyScore(relatedSignals, now);
        const newsScore = getNewsScore(relatedSignals, now);
        const behaviorScore = getBehaviorScore(tradeClickCount, chartClickCount);

        const marketSnapshot = marketSnapshotMap.get(asset.symbol) || null;

        const technicalResult = getTechnicalScore({
          latestBias,
          strongestConfidence,
          signalCount,
          recencyScore,
          marketSnapshot,
        });

        const technicalScore = technicalResult.score;

        const totalScore = clampEdgeScore(
          signalScore +
            recencyScore +
            newsScore +
            technicalScore +
            behaviorScore
        );

        const setupStrength = deriveSetupStrengthFromTotal(totalScore);

        const tradeCall = deriveTradeCall(
          latestBias,
          strongestConfidence,
          signalCount,
          clickCount,
          technicalScore,
          marketSnapshot
        );

        return {
          ...asset,
          edgeScore: {
            signal: signalScore,
            recency: recencyScore,
            news: newsScore,
            technical: technicalScore,
            behavior: behaviorScore,
            total: totalScore,
          },
          signalCount,
          clickCount,
          tradeClickCount,
          chartClickCount,
          latestBias,
          strongestConfidence,
          tradeCall,
          setupStrength,
          recommendation: buildRecommendation(
            tradeCall,
            setupStrength,
            strongestConfidence,
            signalCount,
            clickCount,
            technicalScore,
            totalScore
          ),
        };
      })
      .sort((a, b) => {
        if (b.edgeScore.total !== a.edgeScore.total) {
          return b.edgeScore.total - a.edgeScore.total;
        }

        if (b.edgeScore.technical !== a.edgeScore.technical) {
          return b.edgeScore.technical - a.edgeScore.technical;
        }

        if (b.signalCount !== a.signalCount) {
          return b.signalCount - a.signalCount;
        }

        return b.clickCount - a.clickCount;
      });
  }, [clicks, marketSnapshotMap, now, publishedSignals]);

  const topRecommendations = rankedAssets.slice(0, 3);
  const watchlistAssets = rankedAssets.slice(3);

  return (
    <main className="min-h-screen bg-transparent text-white">
      <Header />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-[32px] border border-zinc-800/90 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_34%),linear-gradient(135deg,rgba(24,24,27,0.96)_0%,rgba(10,10,12,0.97)_48%,rgba(6,6,8,0.99)_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                TradeRadar Recommendation Layer
              </div>

              <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Signal-driven focus for South African day-trading setups.
              </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
  This board ranks South African and global macro-linked instruments using
  published signal activity, confidence, recency, news alignment, trader
  behavior, and real market movement. It is a recommendation layer, not a
  live quote engine.
</p>

<div className="mt-3">
  <Link
    href="/playbook"
    className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300 transition hover:text-white"
  >
    Not sure how to read this? → Open Playbook
  </Link>
</div>


              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(10,10,12,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.28)]">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Assets ranked
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {rankedAssets.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(10,10,12,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.28)]">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Published signals
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-emerald-300">
                    {publishedSignals.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(10,10,12,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.28)]">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Click signals
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-sky-300">
                    {clicks.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(10,10,12,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.28)]">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Market snapshots
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-amber-300">
                    {marketSnapshots.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_36px_rgba(0,0,0,0.35)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Recommendation state
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  Edge-ranked
                </div>
              </div>

              {topRecommendations[0] ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Top focus now
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {topRecommendations[0].symbol}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Edge score
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {topRecommendations[0].edgeScore.total}/100
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Trade call
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getTradeCallStyles(
                          topRecommendations[0].tradeCall
                        )}`}
                      >
                        {topRecommendations[0].tradeCall}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Setup strength
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getSetupStrengthStyles(
                          topRecommendations[0].setupStrength
                        )}`}
                      >
                        {topRecommendations[0].setupStrength}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Recommendation
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {topRecommendations[0].recommendation}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Current bias
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {topRecommendations[0].latestBias}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Confidence
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {topRecommendations[0].strongestConfidence}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Signal count
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {topRecommendations[0].signalCount}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Click count
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {topRecommendations[0].clickCount}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.92)_0%,rgba(8,8,10,0.96)_100%)] p-4 text-sm text-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  Recommendation data will appear once published signals are available.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(14,14,16,0.94)_0%,rgba(4,4,6,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_28px_rgba(0,0,0,0.3)] sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Recommended Now
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-white">
                TradeRadar Top Focus
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                Ranked by signal, recency, news alignment, technical state, and trader attention.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                Engine
              </div>
              <div className="mt-1 text-base font-semibold leading-tight text-white">
                Edge Score
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.99)_100%)] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_16px_40px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Score logic
              </div>

              <h3 className="text-xl font-semibold tracking-tight text-white">
                How TradeRadar ranks assets
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-400">
                Rankings combine internal signals, freshness, live news alignment, trader behavior,
                and real market movement. This is a relevance engine, not a live market data feed.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
              Transparent scoring
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(22,22,24,0.94)_0%,rgba(8,8,10,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Signal
              </div>
              <div className="mt-2 text-sm leading-7 text-zinc-300">
                Confidence-weighted internal signal support
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(22,22,24,0.94)_0%,rgba(8,8,10,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Recency
              </div>
              <div className="mt-2 text-sm leading-7 text-zinc-300">
                Fresher signals rank higher
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(22,22,24,0.94)_0%,rgba(8,8,10,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                News
              </div>
              <div className="mt-2 text-sm leading-7 text-zinc-300">
                Live news-derived signals contribute only on Live
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(22,22,24,0.94)_0%,rgba(8,8,10,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Technical
              </div>
              <div className="mt-2 text-sm leading-7 text-zinc-300">
                Technical confirmation reinforces directional setups
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(22,22,24,0.94)_0%,rgba(8,8,10,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Behavior
              </div>
              <div className="mt-2 text-sm leading-7 text-zinc-300">
                Trade intent is weighted above chart curiosity
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-3">
          {topRecommendations.map((asset, index) => (
            <article
              key={asset.id}
              className="overflow-hidden rounded-3xl border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(20,20,22,0.96)_0%,rgba(6,6,8,0.99)_100%)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_rgba(0,0,0,0.45)]"
            >
              <div className="border-b border-zinc-800/80 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_30%),linear-gradient(180deg,rgba(20,20,22,0.96)_0%,rgba(10,10,12,0.98)_100%)] px-5 py-4 sm:px-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    Rank #{index + 1}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getTradeCallStyles(
                      asset.tradeCall
                    )}`}
                  >
                    {asset.tradeCall}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getSetupStrengthStyles(
                      asset.setupStrength
                    )}`}
                  >
                    {asset.setupStrength}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getBiasStyles(
                      asset.latestBias
                    )}`}
                  >
                    {asset.latestBias}
                  </span>
                </div>

                <h3 className="text-lg font-semibold leading-tight text-white sm:text-xl">
                  {asset.name}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                  <span>{asset.symbol}</span>
                  <span className="text-zinc-600">•</span>
                  <span>{asset.focus}</span>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                <section className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Recommendation
                  </div>
                  <p className="text-sm leading-7 text-zinc-100">
                    {asset.recommendation}
                  </p>
                </section>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Edge Score
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {asset.edgeScore.total}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Signals
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {asset.signalCount}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Clicks
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {asset.clickCount}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Strength
                    </div>
                    <div className="mt-1 text-sm font-semibold text-emerald-400">
                      {asset.setupStrength}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Signal
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {asset.edgeScore.signal}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Recency
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {asset.edgeScore.recency}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      News
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {asset.edgeScore.news}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Technical
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {asset.edgeScore.technical}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-center">
                  <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                    Behavior
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {asset.edgeScore.behavior}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => {
                        try {
                          const existing = window.localStorage.getItem("tradeClicks");
                          const parsed = existing ? JSON.parse(existing) : [];

                          parsed.push({
                            asset: asset.symbol,
                            type: "chart",
                            time: new Date().toISOString(),
                          });

                          window.localStorage.setItem("tradeClicks", JSON.stringify(parsed));
                        } catch {}

                        window.open(asset.chartUrl, "_blank");
                      }}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-zinc-700 bg-[linear-gradient(180deg,rgba(24,24,26,0.92)_0%,rgba(10,10,12,0.98)_100%)] px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
                    >
                      VIEW CHART
                    </button>

                    <button
                      onClick={() => {
                        try {
                          const existing = window.localStorage.getItem("tradeClicks");
                          const parsed = existing ? JSON.parse(existing) : [];

                          parsed.push({
                            asset: asset.symbol,
                            type: "trade",
                            time: new Date().toISOString(),
                          });

                          window.localStorage.setItem("tradeClicks", JSON.stringify(parsed));
                        } catch {}

                        window.open(
                          `/api/redirect?asset=${encodeURIComponent(asset.symbol)}&type=trade`,
                          "_blank"
                        );
                      }}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.96)_0%,rgba(5,150,105,0.96)_100%)] px-4 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(16,185,129,0.22)] transition hover:brightness-110"
                    >
                      TRADE THIS
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Expanded Global Watchlist
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              South African and selected global instruments ranked by current TradeRadar relevance.
            </p>
          </div>

          <div className="rounded-full border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(12,12,14,0.92)_0%,rgba(4,4,6,0.98)_100%)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            {watchlistAssets.length} additional instruments
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {watchlistAssets.map((asset) => (
            <article
              key={asset.id}
              className="overflow-hidden rounded-3xl border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(20,20,22,0.96)_0%,rgba(6,6,8,0.99)_100%)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_rgba(0,0,0,0.45)]"
            >
              <div className="border-b border-zinc-800/80 bg-[linear-gradient(180deg,rgba(20,20,22,0.96)_0%,rgba(10,10,12,0.98)_100%)] px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                        {asset.market}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getTradeCallStyles(
                          asset.tradeCall
                        )}`}
                      >
                        {asset.tradeCall}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getSetupStrengthStyles(
                          asset.setupStrength
                        )}`}
                      >
                        {asset.setupStrength}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getBiasStyles(
                          asset.latestBias
                        )}`}
                      >
                        {asset.latestBias}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold leading-tight text-white sm:text-xl">
                      {asset.name}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                      <span>{asset.symbol}</span>
                      <span className="text-zinc-600">•</span>
                      <span>{asset.focus}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] px-4 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Edge Score
                    </div>
                    <div className="mt-1 text-base font-semibold leading-tight text-white">
                      {asset.edgeScore.total}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                <section className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Why it matters
                  </div>
                  <p className="text-sm leading-7 text-zinc-300">{asset.reason}</p>
                </section>

                <section className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    TradeRadar view
                  </div>
                  <p className="text-sm leading-7 text-zinc-100">
                    {asset.recommendation}
                  </p>
                </section>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Signals
                    </div>
                    <div className="mt-1 text-base font-semibold leading-tight text-white">
                      {asset.signalCount}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Clicks
                    </div>
                    <div className="mt-1 text-base font-semibold leading-tight text-white">
                      {asset.clickCount}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Confidence
                    </div>
                    <div className="mt-1 text-base font-semibold leading-tight text-white">
                      {asset.strongestConfidence}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Strength
                    </div>
                    <div className="mt-1 text-base font-semibold leading-tight text-white">
                      {asset.setupStrength}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-5">
                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Signal
                    </div>
                    <div className="mt-1 text-base font-semibold leading-tight text-white">
                      {asset.edgeScore.signal}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Recency
                    </div>
                    <div className="mt-1 text-base font-semibold leading-tight text-white">
                      {asset.edgeScore.recency}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      News
                    </div>
                    <div className="mt-1 text-base font-semibold leading-tight text-white">
                      {asset.edgeScore.news}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Technical
                    </div>
                    <div className="mt-1 text-base font-semibold leading-tight text-white">
                      {asset.edgeScore.technical}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Behavior
                    </div>
                    <div className="mt-1 text-base font-semibold leading-tight text-white">
                      {asset.edgeScore.behavior}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-zinc-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Open external chart workspace
                  </div>

                  <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
                    <button
                      onClick={() => {
                        try {
                          const existing = window.localStorage.getItem("tradeClicks");
                          const parsed = existing ? JSON.parse(existing) : [];

                          parsed.push({
                            asset: asset.symbol,
                            type: "chart",
                            time: new Date().toISOString(),
                          });

                          window.localStorage.setItem(
                            "tradeClicks",
                            JSON.stringify(parsed)
                          );
                        } catch {}

                        window.open(asset.chartUrl, "_blank");
                      }}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-zinc-700 bg-[linear-gradient(180deg,rgba(24,24,26,0.92)_0%,rgba(10,10,12,0.98)_100%)] px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
                    >
                      VIEW CHART
                    </button>

                    <button
                      onClick={() => {
                        try {
                          const existing = window.localStorage.getItem("tradeClicks");
                          const parsed = existing ? JSON.parse(existing) : [];

                          parsed.push({
                            asset: asset.symbol,
                            type: "trade",
                            time: new Date().toISOString(),
                          });

                          window.localStorage.setItem(
                            "tradeClicks",
                            JSON.stringify(parsed)
                          );
                        } catch {}

                        window.open(
                          `/api/redirect?asset=${encodeURIComponent(
                            asset.symbol
                          )}&type=trade`,
                          "_blank"
                        );
                      }}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.96)_0%,rgba(5,150,105,0.96)_100%)] px-4 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(16,185,129,0.22)] transition hover:brightness-110"
                    >
                      TRADE THIS
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <FloatingTradeButton />
    </main>
  );
}