"use client";

import { useSyncExternalStore } from "react";
import { signals as initialSignals } from "@/data/signals";
import { getTradeLink } from "@/lib/utils";
import type { TradeSignal } from "@/lib/types";

function subscribeToClientReady(onStoreChange: () => void) {
  onStoreChange();
  return () => {};
}

function getClientReadySnapshot() {
  return true;
}

function getClientReadyServerSnapshot() {
  return false;
}

function getStoredSignals(): TradeSignal[] {
  if (typeof window === "undefined") {
    return initialSignals;
  }

  const stored = window.localStorage.getItem("tradeRadarSignals");

  if (!stored) {
    return initialSignals;
  }

  try {
    const parsed = JSON.parse(stored) as TradeSignal[];
    return parsed.length > 0 ? parsed : initialSignals;
  } catch {
    return initialSignals;
  }
}

function FloatingTradeButtonClient() {
  const signals = getStoredSignals();

  const topPublishedSignal = [...signals]
    .filter((signal) => signal.status === "published")
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  if (!topPublishedSignal) return null;

  const primaryAsset = topPublishedSignal.assets[0] || "Open trade";
  const href = getTradeLink(topPublishedSignal.assets);

  const handleClick = () => {
    if (typeof window === "undefined") return;

    const clickData = {
      asset: primaryAsset,
      link: href,
      time: new Date().toISOString(),
    };

    const existing = window.localStorage.getItem("tradeClicks");
    const clicks = existing ? JSON.parse(existing) : [];

    clicks.push(clickData);

    window.localStorage.setItem("tradeClicks", JSON.stringify(clicks));
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3 sm:hidden">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-emerald-500/20 bg-black/80 p-2 shadow-[0_16px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <a
          href={href}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[64px] w-full items-center justify-between gap-3 rounded-xl border border-emerald-400/10 bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-3 text-black transition hover:brightness-105 active:scale-[0.99]"
        >
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/65">
              Highest priority
            </div>

            <div className="mt-1 truncate text-base font-black uppercase tracking-[0.08em]">
              {primaryAsset}
            </div>
          </div>

          <div className="shrink-0 text-sm font-black uppercase tracking-[0.12em]">
            Execute →
          </div>
        </a>
      </div>
    </div>
  );
}

export default function FloatingTradeButton() {
  const isClient = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getClientReadyServerSnapshot
  );

  if (!isClient) {
    return null;
  }

  return <FloatingTradeButtonClient />;
}