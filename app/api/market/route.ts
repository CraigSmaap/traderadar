import { NextResponse } from "next/server";
import {
  buildEmptySnapshot,
  buildSnapshotFromYahooChart,
  getProviderSymbols,
} from "@/lib/market";

const LIVE_MARKET_SYMBOLS = [
  "J200",
  "NPN",
  "PRX",
  "AGL",
  "BHG",
  "GFI",
  "HAR",
  "SOL",
  "MTN",
  "VOD",
  "SHP",
  "FSR",
  "SBK",
  "ABG",
  "NED",
  "XAUUSD",
  "USDZAR",
  "EURUSD",
  "GBPUSD",
  "SPX",
  "NASDAQ",
  "OIL",
] as const;

type YahooChartApiResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
        }>;
      };
    }>;
    error?: unknown;
  };
};

async function fetchYahooChart(providerSymbol: string) {
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      providerSymbol
    )}`
  );

  url.searchParams.set("interval", "5m");
  url.searchParams.set("range", "1d");
  url.searchParams.set("includePrePost", "false");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 TradeRadar/1.0",
    },
    next: { revalidate: 1500 },
  });

  if (!response.ok) {
    throw new Error(`Market fetch failed for ${providerSymbol}: ${response.status}`);
  }

  const data = (await response.json()) as YahooChartApiResponse;
  return data.chart?.result?.[0];
}

async function fetchWithFallbacks(appSymbol: string) {
  const providerSymbols = getProviderSymbols(appSymbol);
  let lastError: unknown = null;

  for (const providerSymbol of providerSymbols) {
    try {
      const result = await fetchYahooChart(providerSymbol);

      if (result) {
        return buildSnapshotFromYahooChart({
          appSymbol,
          providerSymbol,
          result,
        });
      }
    } catch (error) {
      lastError = error;
      console.warn(
        `Market fetch fallback failed for ${appSymbol} via ${providerSymbol}:`,
        error
      );
    }
  }

  throw lastError || new Error(`All provider symbols failed for ${appSymbol}`);
}

export async function GET() {
  try {
    const snapshots = await Promise.all(
      LIVE_MARKET_SYMBOLS.map(async (symbol) => {
        try {
          return await fetchWithFallbacks(symbol);
        } catch (error) {
          console.error(`Market snapshot failed for ${symbol}:`, error);
          return buildEmptySnapshot(symbol);
        }
      })
    );

    return NextResponse.json(
      {
        ok: true,
        snapshots,
        updatedAt: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=1500",
        },
      }
    );
  } catch (error) {
    console.error("Market route failed:", error);

    return NextResponse.json(
      {
        ok: false,
        snapshots: LIVE_MARKET_SYMBOLS.map((symbol) => buildEmptySnapshot(symbol)),
        updatedAt: Date.now(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
        },
      }
    );
  }
}