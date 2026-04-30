import type { LotSizeInput, LotSizeResult } from "@/lib/types";

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

function roundLotSize(value: number) {
  return Math.max(0.01, Math.round(value * 100) / 100);
}

export function calculateLotSize(input: LotSizeInput): LotSizeResult {
  const { accountBalance, riskPercent, entryPrice, stopLoss, pipValuePerLot } =
    input;

  if (accountBalance <= 0) {
    throw new Error("Account balance must be greater than 0.");
  }

  if (riskPercent <= 0) {
    throw new Error("Risk percent must be greater than 0.");
  }

  if (entryPrice <= 0 || stopLoss <= 0) {
    throw new Error("Entry price and stop loss must be greater than 0.");
  }

  const stopDistance = Math.abs(entryPrice - stopLoss);

  if (stopDistance <= 0) {
    throw new Error("Stop loss must be different from entry price.");
  }

  const riskAmount = accountBalance * (riskPercent / 100);

  const safePipValuePerLot = pipValuePerLot && pipValuePerLot > 0 ? pipValuePerLot : 10;

  const suggestedLotSize = riskAmount / (stopDistance * safePipValuePerLot);

  return {
    riskAmount: roundToTwoDecimals(riskAmount),
    stopDistance: roundToTwoDecimals(stopDistance),
    suggestedLotSize: roundLotSize(suggestedLotSize),
  };
}