import type { TradeSignal } from "@/lib/types";

export const signals: TradeSignal[] = [
  {
    id: "fed-inflation-001",
    category: "FED SIGNAL",
    event: "US inflation came in higher than expected",
    impact: "Rates likely to stay higher, supporting USD strength",
    saImpact: "Rand may weaken, which puts pressure on USD/ZAR to move higher",

    assets: ["USD/ZAR", "Gold"],
    primaryAsset: "USD/ZAR",
    assetClass: "forex",

    bias: "Bullish",
    confidence: "High",

    tradeUrl: "https://example-broker.com/trade/usdzar",

    percentageMove: 1.4,
    volumeChange: 18,
    volatilityScore: 82,
    momentumScore: 78,
    radarScore: 86,

    tradePlan: {
      direction: "BUY",

      entryPrice: 18.42,
      entryZoneLow: 18.38,
      entryZoneHigh: 18.45,

      stopLoss: 18.24,

      takeProfits: [
        { label: "TP1", price: 18.55 },
        { label: "TP2", price: 18.68 },
        { label: "TP3", price: 18.82 },
      ],

      riskReward: 2.1,
      riskProfile: "balanced",

      planStatus: "valid",

      setupReason: "Higher inflation supports USD strength versus emerging markets.",
      confirmationTrigger: "Hold above 18.38 with momentum candle.",
    },

    timestamp: 1710000000000,
    source: "manual",
    region: "United States",
    status: "published",
  },

  {
    id: "oil-middle-east-002",
    category: "OIL ALERT",
    event: "Middle East tensions increased supply risk",
    impact: "Oil prices may rise on geopolitical fear and supply concerns",
    saImpact:
      "Higher oil can add inflation pressure in South Africa and weaken local sentiment",

    assets: ["Brent Crude", "USD/ZAR", "JSE Top 40"],
    primaryAsset: "Brent Crude",
    assetClass: "commodities",

    bias: "Bullish",
    confidence: "Medium",

    tradeUrl: "https://example-broker.com/trade/oil",

    percentageMove: 2.8,
    volumeChange: 31,
    volatilityScore: 88,
    momentumScore: 74,
    radarScore: 84,

    tradePlan: {
      direction: "BUY",

      entryPrice: 84.2,
      entryZoneLow: 83.8,
      entryZoneHigh: 84.4,

      stopLoss: 82.9,

      takeProfits: [
        { label: "TP1", price: 85.5 },
        { label: "TP2", price: 86.8 },
        { label: "TP3", price: 88.2 },
      ],

      riskReward: 2.4,
      riskProfile: "balanced",

      planStatus: "valid",

      setupReason: "Supply disruption risk supports crude upside momentum.",
      confirmationTrigger: "Break and hold above 84.40.",
    },

    timestamp: 1709999900000,
    source: "manual",
    region: "Middle East",
    status: "published",
  },

  {
    id: "china-demand-003",
    category: "CHINA WATCH",
    event: "China signaled new economic support measures",
    impact: "Commodity demand expectations may improve",
    saImpact:
      "Stronger commodity outlook can support the rand and resource-linked stocks",

    assets: ["Gold", "Platinum", "JSE Resources"],
    primaryAsset: "Gold",
    assetClass: "commodities",

    bias: "Bullish",
    confidence: "Medium",

    tradeUrl: "https://example-broker.com/trade/commodities",

    percentageMove: 1.1,
    volumeChange: 12,
    volatilityScore: 69,
    momentumScore: 66,
    radarScore: 72,

    tradePlan: {
      direction: "BUY",

      entryPrice: 2388,
      entryZoneLow: 2380,
      entryZoneHigh: 2390,

      stopLoss: 2364,

      takeProfits: [
        { label: "TP1", price: 2405 },
        { label: "TP2", price: 2422 },
        { label: "TP3", price: 2440 },
      ],

      riskReward: 2.0,
      riskProfile: "conservative",

      planStatus: "waiting-confirmation",

      setupReason: "China stimulus may improve metals demand.",
      confirmationTrigger: "Daily close above 2390.",
    },

    timestamp: 1709999800000,
    source: "manual",
    region: "China",
    status: "published",
  },
];