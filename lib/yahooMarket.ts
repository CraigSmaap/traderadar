import type { AssetClass, SignalBias } from "@/lib/types";

export type YahooMarketAsset = {
  id: string;
  symbol: string;
  yahooSymbol: string;
  name: string;
  assetClass: AssetClass;
};

export type MarketSnapshot = YahooMarketAsset & {
  price: number;
  previousPrice: number;
  percentageMove: number;
  volumeChange: number;
  volatilityScore: number;
  momentumScore: number;
  trendScore: number;
  atr: number;
  radarScore: number;
  bias: SignalBias;
  trend: "UP" | "DOWN" | "FLAT";
};

const yahooAssets: YahooMarketAsset[] = [
  { id: "usdzar", symbol: "USDZAR", yahooSymbol: "ZAR=X", name: "US Dollar / South African Rand", assetClass: "forex" },
  { id: "xauusd", symbol: "XAUUSD", yahooSymbol: "GC=F", name: "Gold", assetClass: "commodities" },
  { id: "brent", symbol: "BRENT", yahooSymbol: "BZ=F", name: "Brent Crude Oil", assetClass: "commodities" },
  { id: "nasdaq", symbol: "NAS100", yahooSymbol: "^NDX", name: "Nasdaq 100", assetClass: "indices" },
  { id: "spx", symbol: "SPX500", yahooSymbol: "^GSPC", name: "S&P 500", assetClass: "indices" },
  { id: "btc", symbol: "BTCUSD", yahooSymbol: "BTC-USD", name: "Bitcoin", assetClass: "crypto" },
  { id: "eth", symbol: "ETHUSD", yahooSymbol: "ETH-USD", name: "Ethereum", assetClass: "crypto" },
  { id: "j200", symbol: "J200", yahooSymbol: "^JN0U.JO", name: "JSE Top 40", assetClass: "indices" },
  { id: "npn", symbol: "NPN", yahooSymbol: "NPN.JO", name: "Naspers", assetClass: "stocks" },
  { id: "sol", symbol: "SOL", yahooSymbol: "SOL.JO", name: "Sasol", assetClass: "stocks" },
  { id: "gfi", symbol: "GFI", yahooSymbol: "GFI.JO", name: "Gold Fields", assetClass: "stocks" },
  { id: "mtn", symbol: "MTN", yahooSymbol: "MTN.JO", name: "MTN Group", assetClass: "stocks" },
];

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
      };
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
  };
};

function cleanNumbers(values?: Array<number | null>) {
  return (values || []).filter(
    (value): value is number => typeof value === "number" && value > 0
  );
}

function calculatePercentageMove(price: number, previousPrice: number) {
  if (!previousPrice || previousPrice <= 0) return 0;
  return ((price - previousPrice) / previousPrice) * 100;
}

function calculateMomentumScore(percentageMove: number) {
  return Math.min(Math.round(Math.abs(percentageMove) * 18), 100);
}

function calculateVolatilityScore(closes: number[]) {
  if (closes.length < 2) return 50;

  const moves = closes
    .slice(1)
    .map((close, index) => Math.abs((close - closes[index]) / closes[index]));

  const averageMove =
    moves.reduce((total, move) => total + move, 0) / moves.length;

  return Math.min(Math.round(averageMove * 10000), 100);
}

function calculateVolumeChange(volumes: number[]) {
  const cleanVolumes = volumes.filter((volume) => volume > 0);
  if (cleanVolumes.length < 2) return 0;

  const latest = cleanVolumes[cleanVolumes.length - 1];
  const previous = cleanVolumes[cleanVolumes.length - 2];

  if (!previous || previous <= 0) return 0;

  return Math.round(((latest - previous) / previous) * 100);
}

function calculateAtr(highs: number[], lows: number[], closes: number[]) {
  const length = Math.min(highs.length, lows.length, closes.length);

  if (length < 2) return 0;

  const trueRanges: number[] = [];

  for (let i = 1; i < length; i += 1) {
    const high = highs[i];
    const low = lows[i];
    const previousClose = closes[i - 1];

    const tr = Math.max(
      high - low,
      Math.abs(high - previousClose),
      Math.abs(low - previousClose)
    );

    trueRanges.push(tr);
  }

  const recent = trueRanges.slice(-14);
  return recent.reduce((total, value) => total + value, 0) / recent.length;
}

function calculateTrend(closes: number[]) {
  if (closes.length < 5) {
    return {
      trend: "FLAT" as const,
      trendScore: 50,
    };
  }

  const latest = closes[closes.length - 1];
  const previous = closes[closes.length - 5];
  const move = ((latest - previous) / previous) * 100;

  if (move > 0.5) {
    return {
      trend: "UP" as const,
      trendScore: Math.min(60 + Math.round(move * 8), 100),
    };
  }

  if (move < -0.5) {
    return {
      trend: "DOWN" as const,
      trendScore: Math.min(60 + Math.round(Math.abs(move) * 8), 100),
    };
  }

  return {
    trend: "FLAT" as const,
    trendScore: 45,
  };
}

function calculateRadarScore(input: {
  percentageMove: number;
  volumeChange: number;
  volatilityScore: number;
  momentumScore: number;
  trendScore: number;
}) {
  const moveScore = Math.min(Math.abs(input.percentageMove) * 10, 30);
  const volumeScore = Math.min(Math.abs(input.volumeChange), 20);
  const volatilityScore = input.volatilityScore * 0.15;
  const momentumScore = input.momentumScore * 0.2;
  const trendScore = input.trendScore * 0.25;

  return Math.min(
    Math.round(moveScore + volumeScore + volatilityScore + momentumScore + trendScore),
    100
  );
}

function getBias(percentageMove: number, trend: "UP" | "DOWN" | "FLAT"): SignalBias {
  if (trend === "UP" && percentageMove > 0) return "Bullish";
  if (trend === "DOWN" && percentageMove < 0) return "Bearish";
  if (percentageMove > 1) return "Bullish";
  if (percentageMove < -1) return "Bearish";
  return "Neutral";
}

async function fetchYahooSnapshot(
  asset: YahooMarketAsset
): Promise<MarketSnapshot | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      asset.yahooSymbol
    )}?range=1mo&interval=1d`;

    const response = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        "User-Agent": "TradeRadar/1.0",
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as YahooChartResponse;
    const result = data.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];

    if (!result || !quote) return null;

    const closes = cleanNumbers(quote.close);
    const highs = cleanNumbers(quote.high);
    const lows = cleanNumbers(quote.low);
    const volumes = cleanNumbers(quote.volume);

    const price = result.meta?.regularMarketPrice || closes[closes.length - 1] || 0;

    const previousPrice =
      result.meta?.chartPreviousClose ||
      result.meta?.previousClose ||
      closes[closes.length - 2] ||
      price;

    if (!price || !previousPrice) return null;

    const percentageMove = calculatePercentageMove(price, previousPrice);
    const volumeChange = calculateVolumeChange(volumes);
    const volatilityScore = calculateVolatilityScore(closes);
    const momentumScore = calculateMomentumScore(percentageMove);
    const atr = calculateAtr(highs, lows, closes);
    const trendResult = calculateTrend(closes);
    const bias = getBias(percentageMove, trendResult.trend);

    const radarScore = calculateRadarScore({
      percentageMove,
      volumeChange,
      volatilityScore,
      momentumScore,
      trendScore: trendResult.trendScore,
    });

    return {
      ...asset,
      price,
      previousPrice,
      percentageMove,
      volumeChange,
      volatilityScore,
      momentumScore,
      trendScore: trendResult.trendScore,
      atr,
      radarScore,
      bias,
      trend: trendResult.trend,
    };
  } catch {
    return null;
  }
}

export async function getRealMarketSnapshots() {
  const results = await Promise.all(
    yahooAssets.map((asset) => fetchYahooSnapshot(asset))
  );

  return results
    .filter((asset): asset is MarketSnapshot => Boolean(asset))
    .sort((a, b) => b.radarScore - a.radarScore);
}