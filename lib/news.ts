import type { TradeSignal } from "@/lib/types";

export type NewsItem = {
  title: string;
  region: string;
  category: string;
};

export const mockNews: NewsItem[] = [
  {
    title: "US inflation rises above expectations",
    region: "United States",
    category: "FED SIGNAL",
  },
  {
    title: "Oil supply concerns rise amid Middle East tension",
    region: "Middle East",
    category: "OIL ALERT",
  },
  {
    title: "China announces economic stimulus plans",
    region: "China",
    category: "CHINA WATCH",
  },
];

export function convertNewsToSignal(news: NewsItem): TradeSignal | null {
  const title = news.title.toLowerCase();

  let bias: TradeSignal["bias"] = "Risk-Off";
  let confidence: TradeSignal["confidence"] = "Medium";
  let assets: string[] = [];
  let impact = "Market reacting to macro development";
  let saImpact = "Potential impact on South African markets";

  const isRelevant =
    title.includes("inflation") ||
    title.includes("interest") ||
    title.includes("fed") ||
    title.includes("oil") ||
    title.includes("china") ||
    title.includes("war") ||
    title.includes("geopolit");

  if (!isRelevant) {
    return null;
  }

  if (
    title.includes("inflation") ||
    title.includes("interest") ||
    title.includes("fed")
  ) {
    bias = "Bullish";
    confidence = "High";
    assets = ["USD/ZAR", "Gold"];
    impact = "Rate expectations may shift higher, supporting USD strength.";
    saImpact =
      "A stronger USD can pressure the rand and lift USD/ZAR for South African traders.";
  }

  if (title.includes("oil")) {
    bias = "Risk-Off";
    confidence = "High";
    assets = ["Brent Crude", "USD/ZAR"];
    impact = "Oil supply risk may drive energy prices higher and hurt sentiment.";
    saImpact =
      "Higher oil can increase inflation pressure in South Africa and weaken the rand.";
  }

  if (title.includes("china")) {
    bias = "Bullish";
    confidence = "Medium";
    assets = ["Gold", "Platinum"];
    impact = "China stimulus can improve commodity demand expectations.";
    saImpact =
      "South African resource-linked assets may benefit if commodity demand strengthens.";
  }

  if (title.includes("war") || title.includes("geopolit")) {
    bias = "Risk-Off";
    confidence = "High";
    assets = ["Gold", "USD/ZAR"];
    impact = "Geopolitical stress is driving defensive positioning across markets.";
    saImpact =
      "Risk aversion can weaken the rand and increase demand for defensive assets.";
  }

  return {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    category: news.category,
    event: news.title,
    impact,
    saImpact,
    assets,
    bias,
    confidence,
    tradeUrl: "#",
    timestamp: Date.now(),
    source: "news-api",
    region: news.region,
    status: "draft",
  };
}