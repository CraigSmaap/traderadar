"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";

type JournalEntry = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  exit_price: number | null;
  lot_size: number | null;
  pnl_amount: number | null;
  pnl_percent: number | null;
  emotion: string | null;
  notes: string | null;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
};

const ASSETS = [
  "XAUUSD",
  "BTCUSD",
  "ETHUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "USDZAR",
  "US30",
  "NAS100",
  "SPX500",
  "XAGUSD",
  "USOIL",
];

const emotions = ["Calm", "FOMO", "Revenge", "Hesitant", "Confident"];

function calculatePnl(
  direction: "BUY" | "SELL",
  entry: number,
  exit: number,
  lot: number
) {
  const difference = direction === "BUY" ? exit - entry : entry - exit;
  return difference * lot * 100;
}

export default function JournalPage() {
  return (
    <Suspense fallback={<JournalLoading />}>
      <JournalPageContent />
    </Suspense>
  );
}

function JournalLoading() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-zinc-400">Loading journal...</p>
      </section>
    </main>
  );
}

function JournalPageContent() {
  const searchParams = useSearchParams();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState("");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [emotion, setEmotion] = useState("Calm");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadEntries() {
    setLoading(true);

    const response = await fetch("/api/journal", { cache: "no-store" });

    if (response.ok) {
      setEntries((await response.json()) as JournalEntry[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const assetParam = searchParams.get("asset");
      const directionParam = searchParams.get("direction");
      const entryParam = searchParams.get("entry");

      if (assetParam) {
        setAsset(assetParam.toUpperCase());
      }

      if (directionParam === "BUY" || directionParam === "SELL") {
        setDirection(directionParam);
      }

      if (entryParam) {
        setEntryPrice(entryParam);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadEntries();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const calculatedPnl = useMemo(() => {
    const entry = Number(entryPrice);
    const exit = Number(exitPrice);
    const lot = Number(lotSize);

    if (!entryPrice || !exitPrice || !lotSize) return null;

    if (Number.isNaN(entry) || Number.isNaN(exit) || Number.isNaN(lot)) {
      return null;
    }

    return calculatePnl(direction, entry, exit, lot);
  }, [direction, entryPrice, exitPrice, lotSize]);

  const stats = useMemo(() => {
    const closed = entries.filter((entry) => entry.status === "closed");

    const totalPnl = closed.reduce(
      (sum, entry) => sum + Number(entry.pnl_amount || 0),
      0
    );

    const wins = closed.filter((entry) => Number(entry.pnl_amount || 0) > 0);
    const losses = closed.filter((entry) => Number(entry.pnl_amount || 0) < 0);

    const winRate =
      closed.length === 0 ? 0 : Math.round((wins.length / closed.length) * 100);

    const avgWin =
      wins.length === 0
        ? 0
        : wins.reduce((sum, entry) => sum + Number(entry.pnl_amount || 0), 0) /
          wins.length;

    const avgLoss =
      losses.length === 0
        ? 0
        : losses.reduce(
            (sum, entry) => sum + Number(entry.pnl_amount || 0),
            0
          ) / losses.length;

    const assetMap: Record<string, number> = {};

    closed.forEach((entry) => {
      assetMap[entry.asset] =
        (assetMap[entry.asset] || 0) + Number(entry.pnl_amount || 0);
    });

    const bestAsset =
      Object.entries(assetMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const emotionMap: Record<string, number> = {};

    closed.forEach((entry) => {
      if (!entry.emotion) return;

      emotionMap[entry.emotion] =
        (emotionMap[entry.emotion] || 0) + Number(entry.pnl_amount || 0);
    });

    const bestEmotion =
      Object.entries(emotionMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return {
      totalTrades: entries.length,
      openTrades: entries.filter((entry) => entry.status === "open").length,
      totalPnl,
      winRate,
      avgWin,
      avgLoss,
      bestAsset,
      bestEmotion,
    };
  }, [entries]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const entryNumber = Number(entryPrice);
    const exitNumber = exitPrice ? Number(exitPrice) : null;
    const lotNumber = lotSize ? Number(lotSize) : null;

    const pnlNumber =
      exitNumber !== null && lotNumber !== null
        ? calculatePnl(direction, entryNumber, exitNumber, lotNumber)
        : null;

    const response = await fetch("/api/journal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset,
        direction,
        entry_price: entryNumber,
        exit_price: exitNumber,
        lot_size: lotNumber,
        pnl_amount: pnlNumber,
        pnl_percent:
          pnlNumber !== null && entryNumber !== 0
            ? (pnlNumber / entryNumber) * 100
            : null,
        emotion,
        notes,
        status: exitNumber !== null && lotNumber !== null ? "closed" : "open",
      }),
    });

    if (response.ok) {
      setAsset("");
      setDirection("BUY");
      setEntryPrice("");
      setExitPrice("");
      setLotSize("");
      setEmotion("Calm");
      setNotes("");
      await loadEntries();
    } else {
      const data = await response.json();
      alert(data.error || "Could not save journal entry.");
    }

    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),linear-gradient(135deg,rgba(24,24,27,0.96),rgba(6,6,8,0.99))] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Trading Journal
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">
            Track your trades and PnL.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
            Signals help you enter. Journaling helps you improve. Track every
            trade, your emotion, and your profit or loss.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Trades" value={stats.totalTrades} />
          <StatCard label="Open Trades" value={stats.openTrades} />
          <StatCard label="Win Rate" value={`${stats.winRate}%`} />
          <StatCard
            label="Total PnL"
            value={`$${stats.totalPnl.toFixed(2)}`}
            color={stats.totalPnl >= 0 ? "text-emerald-300" : "text-red-300"}
          />
          <StatCard
            label="Avg Win"
            value={`$${stats.avgWin.toFixed(2)}`}
            color="text-emerald-300"
          />
          <StatCard
            label="Avg Loss"
            value={`$${stats.avgLoss.toFixed(2)}`}
            color="text-red-300"
          />
          <StatCard label="Best Asset" value={stats.bestAsset} />
          <StatCard label="Best Emotion" value={stats.bestEmotion} />
        </div>

        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Add Trade
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <Field label="Asset">
              <select
                value={asset}
                onChange={(event) => setAsset(event.target.value)}
                required
                className="input"
              >
                <option value="">Select asset</option>
                {ASSETS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Direction">
              <select
                value={direction}
                onChange={(event) =>
                  setDirection(event.target.value as "BUY" | "SELL")
                }
                className="input"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </Field>

            <Field label="Entry Price">
              <input
                value={entryPrice}
                onChange={(event) => setEntryPrice(event.target.value)}
                required
                type="number"
                step="0.00001"
                className="input"
              />
            </Field>

            <Field label="Exit Price">
              <input
                value={exitPrice}
                onChange={(event) => setExitPrice(event.target.value)}
                type="number"
                step="0.00001"
                className="input"
              />
            </Field>

            <Field label="Lot Size">
              <input
                value={lotSize}
                onChange={(event) => setLotSize(event.target.value)}
                type="number"
                step="0.01"
                className="input"
              />
            </Field>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                Auto PnL
              </p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  Number(calculatedPnl || 0) >= 0
                    ? "text-emerald-300"
                    : "text-red-300"
                }`}
              >
                {calculatedPnl === null
                  ? "Open trade"
                  : `$${calculatedPnl.toFixed(2)}`}
              </p>
            </div>

            <Field label="Emotion">
              <select
                value={emotion}
                onChange={(event) => setEmotion(event.target.value)}
                className="input"
              >
                {emotions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="What happened?"
                className="input"
              />
            </Field>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60 md:col-span-2"
            >
              {saving ? "Saving..." : "Save Trade"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Recent Trades
          </p>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="text-sm text-zinc-400">Loading journal...</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No trades logged yet. Add your first trade above.
              </p>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-zinc-800 bg-black/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {entry.asset} · {entry.direction}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Entry: {entry.entry_price} · Exit:{" "}
                        {entry.exit_price ?? "Open"} · Lot:{" "}
                        {entry.lot_size ?? "—"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          Number(entry.pnl_amount || 0) >= 0
                            ? "text-emerald-300"
                            : "text-red-300"
                        }`}
                      >
                        {entry.pnl_amount === null
                          ? "Open"
                          : `$${Number(entry.pnl_amount).toFixed(2)}`}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {new Date(entry.opened_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {entry.notes ? (
                    <p className="mt-3 text-sm text-zinc-400">{entry.notes}</p>
                  ) : null}

                  {entry.emotion ? (
                    <p className="mt-2 text-xs text-zinc-500">
                      Emotion: {entry.emotion}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-semibold ${color || "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}