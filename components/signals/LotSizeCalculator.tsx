"use client";

import { useMemo, useState } from "react";
import { calculateLotSize } from "@/lib/lotSize";

type LotSizeCalculatorProps = {
  defaultEntryPrice?: number;
  defaultStopLoss?: number;
};

export default function LotSizeCalculator({
  defaultEntryPrice,
  defaultStopLoss,
}: LotSizeCalculatorProps) {
  const [accountBalance, setAccountBalance] = useState("1000");
  const [riskPercent, setRiskPercent] = useState("1");
  const [entryPrice, setEntryPrice] = useState(
    defaultEntryPrice ? String(defaultEntryPrice) : ""
  );
  const [riskLimit, setRiskLimit] = useState(
    defaultStopLoss ? String(defaultStopLoss) : ""
  );
  const [pipValuePerLot, setPipValuePerLot] = useState("10");

  const result = useMemo(() => {
    try {
      if (!entryPrice || !riskLimit) return null;

      return calculateLotSize({
        accountBalance: Number(accountBalance),
        riskPercent: Number(riskPercent),
        entryPrice: Number(entryPrice),
        stopLoss: Number(riskLimit),
        pipValuePerLot: Number(pipValuePerLot),
      });
    } catch {
      return null;
    }
  }, [accountBalance, riskPercent, entryPrice, riskLimit, pipValuePerLot]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Position Size
        </p>
        <h3 className="mt-1 text-lg font-semibold text-white">
          Lot Size Calculator
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          Calculate lot size from account balance, risk %, entry and risk limit.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-400">
            Account Balance
          </span>
          <input
            value={accountBalance}
            onChange={(event) => setAccountBalance(event.target.value)}
            type="number"
            min="0"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-400">Risk %</span>
          <input
            value={riskPercent}
            onChange={(event) => setRiskPercent(event.target.value)}
            type="number"
            min="0"
            step="0.1"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-400">Entry Price</span>
          <input
            value={entryPrice}
            onChange={(event) => setEntryPrice(event.target.value)}
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-400">Risk Limit</span>
          <input
            value={riskLimit}
            onChange={(event) => setRiskLimit(event.target.value)}
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium text-zinc-400">
            Pip / Point Value Per Lot
          </span>
          <input
            value={pipValuePerLot}
            onChange={(event) => setPipValuePerLot(event.target.value)}
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
          />
        </label>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-black/30 p-4">
        {result ? (
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Risk Amount
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {result.riskAmount}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Risk Distance
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {result.stopDistance}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Suggested Lot
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-300">
                {result.suggestedLotSize}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Enter valid trade values to calculate suggested lot size.
          </p>
        )}
      </div>
    </div>
  );
}