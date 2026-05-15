import type { Mover, TradeSignalForDb } from "@/lib/strategy";

export function isEntryStillValid(signal: TradeSignalForDb, mover?: Mover) {
  const plan = signal.tradePlan;

  if (!plan || !mover) return false;

  const price = Number(mover.price || 0);
  const entryLow = Number(plan.entryZoneLow ?? plan.entryPrice);
  const entryHigh = Number(plan.entryZoneHigh ?? plan.entryPrice);
  const entryMid = Number(plan.entryPrice || (entryLow + entryHigh) / 2);

  if (!price || !entryMid || entryMid === 0) return false;

  const distanceFromEntry = Math.abs(price - entryMid) / entryMid;

  // Entry zone must be within 1.5% of current price — otherwise price won't
  // reach it before the signal expires and we get 0 wins.
  if (distanceFromEntry > 0.015) return false;

  if (plan.direction === "BUY") {
    // Invalid only if price has already moved too far beyond entry zone.
    if (price > entryHigh && distanceFromEntry > 0.02) return false;
    return true;
  }

  if (plan.direction === "SELL") {
    // Invalid only if price has already moved too far below entry zone.
    if (price < entryLow && distanceFromEntry > 0.02) return false;
    return true;
  }

  return false;
}