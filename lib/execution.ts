import type { Mover, TradeSignalForDb } from "@/lib/strategy";

export function isEntryStillValid(signal: TradeSignalForDb, mover?: Mover) {
  const plan = signal.tradePlan;

  if (!plan || !mover) return false;

  const price = mover.price;
  const entryLow = plan.entryZoneLow ?? plan.entryPrice;
  const entryHigh = plan.entryZoneHigh ?? plan.entryPrice;
  const entryMid = plan.entryPrice || (entryLow + entryHigh) / 2;

  if (!entryMid || entryMid === 0) return false;

  const distanceFromEntry = Math.abs(price - entryMid) / entryMid;

  if (distanceFromEntry > 0.035) return false;

  if (plan.direction === "BUY") {
    if (price > entryHigh) return false;
    return true;
  }

  if (plan.direction === "SELL") {
    if (price < entryLow) return false;
    return true;
  }

  return false;
}