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

  const href = getTradeLink(topPublishedSignal.assets);

  const handleClick = () => {
    if (typeof window === "undefined") return;

    const clickData = {
      asset: topPublishedSignal.assets[0],
      link: href,
      time: new Date().toISOString(),
    };

    const existing = window.localStorage.getItem("tradeClicks");
    const clicks = existing ? JSON.parse(existing) : [];

    clicks.push(clickData);

    window.localStorage.setItem("tradeClicks", JSON.stringify(clicks));
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:hidden">
      <div className="pointer-events-auto w-full max-w-md rounded-[28px] border border-emerald-500/20 bg-black/90 p-2 shadow-[0_16px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <a
          href={href}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-between rounded-[22px] border border-emerald-400/10 bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-4 text-black transition hover:brightness-105 active:scale-[0.99]"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/65">
              Highest priority signal
            </div>
            <div className="mt-1 truncate text-sm font-bold uppercase tracking-[0.14em]">
              {topPublishedSignal.assets[0] || "Open trade"}
            </div>
          </div>

          <div className="shrink-0 text-sm font-black uppercase tracking-[0.14em]">
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