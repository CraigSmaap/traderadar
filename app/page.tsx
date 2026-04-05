"use client";

import { useSyncExternalStore } from "react";
import Header from "@/components/layout/Header";
import LiveAlertsBar from "@/components/layout/LiveAlertsBar";
import SignalCard from "@/components/signals/SignalCard";
import FloatingTradeButton from "@/components/ui/FloatingTradeButton";
import { signals as initialSignals } from "@/data/signals";
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

function HomeClient() {
  const signals = getStoredSignals();

  const publishedSignals = signals
    .filter((signal) => signal.status === "published")
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <section className="mx-auto w-full max-w-2xl px-4 py-5">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-white">Signal Feed</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time macro signals for traders with a South African market
            lens.
          </p>
        </div>

        <LiveAlertsBar />

        <div className="space-y-5">
          {publishedSignals.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
              No published signals available yet.
            </div>
          ) : (
            publishedSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))
          )}
        </div>
      </section>

      <FloatingTradeButton />
    </main>
  );
}

export default function Home() {
  const isClient = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getClientReadyServerSnapshot
  );

  if (!isClient) {
    return null;
  }

  return <HomeClient />;
}