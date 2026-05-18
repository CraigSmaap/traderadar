"use client";

import { useMemo, useState } from "react";
import {
  buildCopyableTradePlan,
  getBrokerActions,
  EXNESS_AFFILIATE_URL,
  EXNESS_TRADING_URL,
} from "@/lib/broker";
import type { TradeSignal } from "@/lib/types";

type BrokerActionPanelProps = {
  signal: TradeSignal;
};

export default function BrokerActionPanel({ signal }: BrokerActionPanelProps) {
  const [copied, setCopied] = useState(false);

  const actions = useMemo(() => getBrokerActions(signal), [signal]);
  const copyText = useMemo(() => buildCopyableTradePlan(signal), [signal]);
  const symbol =
    signal.primaryAsset || signal.assets?.[0] || "this instrument";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const chartAction = actions.find((a) => a.variant === "chart");

  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
      {/* Header */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Execute This Trade
        </p>
        <h4 className="mt-1 text-sm font-semibold text-white">
          Copy the plan, then place the trade manually on Exness.
        </h4>
        <p className="mt-1 text-xs leading-5 text-zinc-400">
          TradeRadar does not place trades automatically. Always confirm all
          values inside your broker before entering.
        </p>
      </div>

      {/* Primary: Trade on Exness */}
      <a
        href={EXNESS_TRADING_URL}
        target="_blank"
        rel="noreferrer"
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3.5 text-sm font-bold text-emerald-300 transition hover:border-emerald-400/60 hover:bg-emerald-500/25 hover:text-emerald-200"
      >
        <svg
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
        Trade {symbol} on Exness
      </a>

      {/* Secondary row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleCopy}
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
        >
          {copied ? "✓ Copied" : "Copy Plan"}
        </button>

        {chartAction ? (
          <a
            href={chartAction.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
            title={chartAction.note}
          >
            View Chart
          </a>
        ) : null}
      </div>

      {/* Register nudge */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-amber-300">No Exness account?</p>
          <p className="text-[11px] text-zinc-500">
            Register free — takes 2 minutes.
          </p>
        </div>
        <a
          href={EXNESS_AFFILIATE_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-3 shrink-0 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-300 transition hover:border-amber-400/60 hover:bg-amber-500/25"
        >
          Register
        </a>
      </div>
    </div>
  );
}
