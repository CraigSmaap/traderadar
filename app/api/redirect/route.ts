import { NextResponse } from "next/server";

type ClickType = "trade" | "chart";

type ClickRecord = {
  asset: string;
  type: ClickType;
  time: string;
  destination: string;
};

type AssetRoute = {
  chart: string;
};

// 🔥 YOUR EXNESS AFFILIATE LINK
const EXNESS_LINK = "https://one.exnessonelink.com/a/c_asi5j35i97";

// Dev-only in-memory storage
const clicks: ClickRecord[] = [];

function normalizeAssetKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

const assetChartMap: Record<string, string> = {
  USDZAR: "https://www.tradingview.com/chart/?symbol=OANDA%3AUSDZAR",
  "USD/ZAR": "https://www.tradingview.com/chart/?symbol=OANDA%3AUSDZAR",

  XAUUSD: "https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD",
  GOLD: "https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD",

  J200: "https://www.tradingview.com/chart/?symbol=JSE%3AJ200",
  "JSE TOP 40": "https://www.tradingview.com/chart/?symbol=JSE%3AJ200",

  NPN: "https://www.tradingview.com/chart/?symbol=JSE%3ANPN",
  PRX: "https://www.tradingview.com/chart/?symbol=JSE%3APRX",
  AGL: "https://www.tradingview.com/chart/?symbol=JSE%3AAGL",
  BHG: "https://www.tradingview.com/chart/?symbol=JSE%3ABHG",
  GFI: "https://www.tradingview.com/chart/?symbol=JSE%3AGFI",
  HAR: "https://www.tradingview.com/chart/?symbol=JSE%3AHAR",
  SOL: "https://www.tradingview.com/chart/?symbol=JSE%3ASOL",
  MTN: "https://www.tradingview.com/chart/?symbol=JSE%3AMTN",
  VOD: "https://www.tradingview.com/chart/?symbol=JSE%3AVOD",
  SHP: "https://www.tradingview.com/chart/?symbol=JSE%3ASHP",
  FSR: "https://www.tradingview.com/chart/?symbol=JSE%3AFSR",
  SBK: "https://www.tradingview.com/chart/?symbol=JSE%3ASBK",
  ABG: "https://www.tradingview.com/chart/?symbol=JSE%3AABG",
  NED: "https://www.tradingview.com/chart/?symbol=JSE%3ANED",
};

const defaultChart = "https://www.tradingview.com";

function resolveChart(asset: string): string {
  const normalized = normalizeAssetKey(asset);

  if (assetChartMap[normalized]) {
    return assetChartMap[normalized];
  }

  if (normalized.includes("USD/ZAR") || normalized.includes("USDZAR")) {
    return assetChartMap.USDZAR;
  }

  if (
    normalized.includes("XAUUSD") ||
    normalized.includes("GOLD") ||
    normalized.includes("BULLION")
  ) {
    return assetChartMap.XAUUSD;
  }

  if (
    normalized.includes("J200") ||
    normalized.includes("TOP 40")
  ) {
    return assetChartMap.J200;
  }

  return defaultChart;
}

function parseType(value: string | null): ClickType {
  return value === "chart" ? "chart" : "trade";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const rawAsset = searchParams.get("asset") || "default";
  const type = parseType(searchParams.get("type"));

  const chartUrl = resolveChart(rawAsset);

  // 🔥 CORE LOGIC
  const destination = type === "chart"
    ? chartUrl
    : EXNESS_LINK;

  const click: ClickRecord = {
    asset: rawAsset,
    type,
    time: new Date().toISOString(),
    destination,
  };

  clicks.push(click);

  console.log("CLICK TRACKED:", click);
  console.log("TOTAL CLICKS:", clicks.length);

  return NextResponse.redirect(destination);
}