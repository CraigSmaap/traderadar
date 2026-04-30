"use client";

import { useMemo, useState } from "react";
import { buildCopyableTradePlan, getBrokerActions } from "@/lib/broker";
import type { TradeSignal } from "@/lib/types";

type BrokerActionPanelProps = {
  signal: TradeSignal;
};

export default function BrokerActionPanel({ signal }: BrokerActionPanelProps) {
  const [copied, setCopied] = useState(false);

  const actions = useMemo(() => getBrokerActions(signal), [signal]);
  const copyText = useMemo(() => buildCopyableTradePlan(signal), [signal]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Broker Conversion
        </p>
        <h4 className="mt-1 text-sm font-semibold text-white">
          Copy the plan, then execute manually.
        </h4>
        <p className="mt-1 text-xs leading-5 text-zinc-400">
          TradeRadar does not place trades automatically yet. Confirm all
          values inside your broker before entering.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={handleCopy}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/15"
        >
          {copied ? "Copied" : "Copy Trade Plan"}
        </button>

        {actions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
            title={action.note}
          >
            {action.label}
          </a>
        ))}
      </div>
    </div>
  );
}