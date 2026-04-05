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
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 sm:hidden">
      <a
        href={href}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full max-w-md rounded-xl bg-green-500 py-4 text-center text-base font-bold text-black shadow-lg"
      >
        TRADE NOW →
      </a>
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