export type SessionType =
  | "overlap"
  | "london"
  | "newyork"
  | "off";

type SastTime = {
  hour: number;
  minute: number;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
};

function getSastTime(): SastTime {
  const now = new Date();

  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const dayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Johannesburg",
    weekday: "short",
  }).formatToParts(now);

  const hour = Number(timeParts.find(p => p.type === "hour")?.value ?? "0");
  const minute = Number(timeParts.find(p => p.type === "minute")?.value ?? "0");
  const dayStr = dayParts.find(p => p.type === "weekday")?.value ?? "";
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = dayMap[dayStr] ?? 1;

  return { hour, minute, dayOfWeek };
}

export function getCurrentSession(): SessionType {
  const { hour, minute, dayOfWeek } = getSastTime();

  // Weekend: all non-crypto markets closed (Saturday + Sunday in SAST)
  if (dayOfWeek === 0 || dayOfWeek === 6) return "off";

  const minutes = hour * 60 + minute;

  // Exness / Forex session windows (SAST = GMT+2)
  // London:  09:00 – 18:00
  // NY:      14:00 – 23:00
  // Overlap: 14:00 – 18:00  ← highest-volatility window
  // Off:     23:00 – 09:00  ← low liquidity, avoid signals
  const londonOpen  = 9  * 60;       // 09:00
  const overlapOpen = 14 * 60;       // 14:00  (NY open + London still active)
  const londonClose = 18 * 60;       // 18:00
  const nyClose     = 23 * 60;       // 23:00

  if (minutes >= overlapOpen && minutes < londonClose) return "overlap";   // 14:00–18:00
  if (minutes >= londonOpen  && minutes < overlapOpen) return "london";    // 09:00–14:00
  if (minutes >= londonClose && minutes < nyClose)     return "newyork";   // 18:00–23:00

  return "off"; // 23:00–09:00
}

/**
 * Returns true when the given Exness asset is physically tradeable right now.
 * Based on actual Exness instrument hours (SAST = GMT+2).
 *
 * Forex:   Mon 00:05 – Fri 23:59 SAST
 * Gold:    Mon 01:05 – Fri 23:55 SAST  (daily maintenance ~23:55–01:05)
 * Oil:     Mon 01:05 – Fri 23:00 SAST
 * US idx:  Mon 01:05 – Fri 23:00 SAST  (cash open 15:30, but futures trade earlier)
 * EU idx:  Mon 09:00 – Fri 22:30 SAST  (DAX / FTSE sessions)
 * Crypto:  24/7 no breaks
 */
export function isAssetOpen(asset: string): boolean {
  const { hour, minute, dayOfWeek } = getSastTime();
  const minutes = hour * 60 + minute;
  const sym = asset.toUpperCase().replace(/[\s\-\/]/g, "");

  // Crypto: always open
  if (["BTCUSD", "ETHUSD", "XRPUSD", "SOLUSD"].includes(sym)) return true;

  // Weekend: all non-crypto closed (Sat + Sun SAST)
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  // Forex pairs: Mon 00:05 – Fri 23:59 (nearly 24/5)
  // Only block the first 5 minutes of Monday (server maintenance) and avoid 00:00–06:00
  // low-liquidity window via session check; physically open all other weekday hours.
  const FOREX = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","USDCHF",
                 "EURGBP","EURJPY","GBPJPY","USDZAR","EURZAR","GBPZAR"];
  if (FOREX.includes(sym)) {
    if (dayOfWeek === 1 && minutes < 5) return false; // Mon 00:00–00:05
    return true;
  }

  // Gold / Silver: daily maintenance 23:55–01:05 SAST
  if (sym === "XAUUSD" || sym === "XAGUSD") {
    if (minutes >= 23 * 60 + 55 || minutes < 65) return false;
    return true;
  }

  // Oil (USOIL / UKOIL): closes 23:00, reopens 01:05 SAST
  if (sym === "USOIL" || sym === "UKOIL") {
    if (minutes >= 23 * 60 || minutes < 65) return false;
    return true;
  }

  // US indices (US500 / NAS100): futures trade from ~01:05, best from 15:30
  // Daily maintenance close 23:00, reopens 01:05 SAST
  if (["US500", "SPX500", "NAS100"].includes(sym)) {
    if (minutes >= 23 * 60 || minutes < 65) return false;
    return true;
  }

  // European indices
  if (sym === "DE40")  { if (minutes < 9 * 60        || minutes >= 22 * 60 + 30) return false; return true; }
  if (sym === "UK100") { if (minutes < 9 * 60         || minutes >= 18 * 60 + 30) return false; return true; }

  // Default: open on weekdays
  return true;
}

/**
 * US equity indices (US500, NAS100) only have meaningful liquidity during
 * the US cash session: 15:30–23:00 SAST. Futures technically trade from ~01:05
 * but pre-market is thin. Gate signals to cash-only hours.
 */
export function isUsEquitySessionOpen(): boolean {
  const { hour, minute, dayOfWeek } = getSastTime();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  const minutes = hour * 60 + minute;
  return minutes >= 15 * 60 + 30 && minutes < 23 * 60;
}

export function getSessionBoost(session: SessionType) {
  switch (session) {
    case "overlap":
      return 2;
    case "london":
    case "newyork":
      return 1;
    default:
      return 0;
  }
}