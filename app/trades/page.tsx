"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { EXNESS_TRADING_URL } from "@/lib/broker";

const REFRESH_MS = 30_000;

type OpenTrade = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  stop_loss: number;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  status: string;
  last_price: number | null;
  pnl_percent: number | null;
  result_label: string | null;
  created_at: string;
  entry_zone_low: number | null;
  entry_zone_high: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number | null | undefined, decimals?: number) {
  if (value == null || isNaN(value)) return "—";
  const d = decimals ?? (value > 1000 ? 2 : value > 10 ? 3 : 5);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function fmtPct(value: number | null | undefined) {
  if (value == null || isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function timeOpen(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function pnlColor(pnl: number | null) {
  if (pnl == null) return "text-zinc-300";
  if (pnl > 0) return "text-emerald-300";
  if (pnl < 0) return "text-red-300";
  return "text-zinc-300";
}

function statusLabel(status: string) {
  if (status === "open") return "OPEN";
  if (status === "waiting") return "WAITING ENTRY";
  if (status === "tp1_running") return "TP1 HIT · RUNNING";
  return status.toUpperCase();
}

function statusColor(status: string) {
  if (status === "open") return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  if (status === "waiting") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  if (status === "tp1_running") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  return "border-zinc-700 bg-zinc-900 text-zinc-400";
}

// ─── Price Progress Bar ───────────────────────────────────────────────────────

function PriceBar({ trade }: { trade: OpenTrade }) {
  const live = trade.last_price ?? trade.entry_price;
  const { direction, entry_price, stop_loss, tp1, tp2, tp3 } = trade;

  const isBuy = direction === "BUY";
  const finalTp = tp3 ?? tp2 ?? tp1;

  if (!finalTp) return null;

  // For BUY: bar spans SL (left) → TP3 (right)
  // For SELL: bar spans TP3 (left) → SL (right)
  const barMin = isBuy ? stop_loss : finalTp;
  const barMax = isBuy ? finalTp : stop_loss;
  const barRange = barMax - barMin;

  if (barRange <= 0) return null;

  const clamp = (v: number) => Math.max(0, Math.min(100, ((v - barMin) / barRange) * 100));

  const entryPct  = clamp(entry_price);
  const livePct   = clamp(live);
  const tp1Pct    = tp1 ? clamp(tp1) : null;
  const tp2Pct    = tp2 ? clamp(tp2) : null;
  const tp3Pct    = tp3 ? clamp(tp3) : null;

  const isProfit = isBuy ? live >= entry_price : live <= entry_price;

  // Distance calculations
  const slDist   = Math.abs(live - stop_loss);
  const tp1Dist  = tp1 ? Math.abs(tp1 - live) : null;

  return (
    <div className="mt-4 space-y-3">
      {/* Bar */}
      <div className="relative h-8 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
        {/* Fill from entry to live price */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ${
            isProfit ? "bg-emerald-500/20" : "bg-red-500/20"
          }`}
          style={{
            left: `${Math.min(entryPct, livePct)}%`,
            width: `${Math.abs(livePct - entryPct)}%`,
          }}
        />

        {/* SL marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-red-500/60"
          style={{ left: `${clamp(stop_loss)}%` }}
        />

        {/* TP markers */}
        {tp1Pct != null && (
          <div className="absolute top-0 h-full w-px bg-emerald-500/40" style={{ left: `${tp1Pct}%` }}>
            <span className="absolute -top-0.5 left-1 text-[9px] text-emerald-400 font-bold">T1</span>
          </div>
        )}
        {tp2Pct != null && (
          <div className="absolute top-0 h-full w-px bg-emerald-500/40" style={{ left: `${tp2Pct}%` }}>
            <span className="absolute -top-0.5 left-1 text-[9px] text-emerald-400 font-bold">T2</span>
          </div>
        )}
        {tp3Pct != null && (
          <div className="absolute top-0 h-full w-px bg-emerald-500/40" style={{ left: `${tp3Pct}%` }}>
            <span className="absolute -top-0.5 left-1 text-[9px] text-emerald-400 font-bold">T3</span>
          </div>
        )}

        {/* Entry marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-zinc-400/60"
          style={{ left: `${entryPct}%` }}
        />

        {/* Live price marker */}
        <div
          className={`absolute top-1 h-6 w-1.5 rounded-full transition-all duration-700 ${
            isProfit ? "bg-emerald-400" : "bg-red-400"
          }`}
          style={{ left: `calc(${livePct}% - 3px)` }}
        />
      </div>

      {/* Labels below bar */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-red-400 font-semibold">SL {fmt(stop_loss)}</span>
        <span className={`font-bold ${isProfit ? "text-emerald-300" : "text-red-300"}`}>
          Live {fmt(live)}
        </span>
        <span className="text-emerald-400 font-semibold">TP3 {fmt(finalTp)}</span>
      </div>

      {/* Distance chips */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-red-300">
          SL distance: {fmt(slDist)} pts
        </span>
        {tp1Dist != null && tp1 && (
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
            To TP1: {fmt(tp1Dist)} pts
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Trade Card ───────────────────────────────────────────────────────────────

function TradeCard({ trade }: { trade: OpenTrade }) {
  const live = trade.last_price ?? trade.entry_price;
  const pnl  = trade.pnl_percent;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-black text-white">{trade.asset}</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
              trade.direction === "BUY"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}>
              {trade.direction}
            </span>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${statusColor(trade.status)}`}>
              {statusLabel(trade.status)}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Open {timeOpen(trade.created_at)} · Entry {fmt(trade.entry_price)}</p>
        </div>

        {/* Live P&L */}
        <div className="shrink-0 text-right">
          <div className={`text-2xl font-black tabular-nums ${pnlColor(pnl)}`}>
            {fmtPct(pnl)}
          </div>
          <div className="text-xs text-zinc-500">Live: {fmt(live)}</div>
        </div>
      </div>

      {/* Price bar */}
      <PriceBar trade={trade} />

      {/* TP levels */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { label: "TP1", price: trade.tp1 },
          { label: "TP2", price: trade.tp2 },
          { label: "TP3", price: trade.tp3 },
          { label: "SL",  price: trade.stop_loss, isSl: true },
        ].map(({ label, price, isSl }) => (
          <div
            key={label}
            className={`rounded-xl border p-3 text-center ${
              isSl
                ? "border-red-500/20 bg-red-500/5"
                : "border-zinc-800 bg-black/30"
            }`}
          >
            <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${isSl ? "text-red-400" : "text-zinc-500"}`}>
              {label}
            </p>
            <p className={`mt-1 text-sm font-bold ${isSl ? "text-red-300" : "text-white"}`}>
              {fmt(price)}
            </p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <a
          href={EXNESS_TRADING_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          Trade on Exness
        </a>
        <a
          href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(trade.asset)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          View Chart
        </a>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TradesPage() {
  const [trades, setTrades]     = useState<OpenTrade[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [tick, setTick]         = useState(0);

  const loadTrades = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("signal_results")
      .select("id,asset,direction,entry_price,stop_loss,tp1,tp2,tp3,status,last_price,pnl_percent,result_label,created_at,entry_zone_low,entry_zone_high")
      .in("status", ["waiting", "open", "tp1_running"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTrades(data as OpenTrade[]);
      setLastUpdate(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTrades();
    const iv = setInterval(() => {
      loadTrades();
      setTick(t => t + 1);
    }, REFRESH_MS);
    return () => clearInterval(iv);
  }, [loadTrades]);

  // Countdown to next refresh
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  useEffect(() => {
    setCountdown(REFRESH_MS / 1000);
    const iv = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(iv);
  }, [tick, lastUpdate]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-2xl">

          {/* Page header */}
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white">Open Trades</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Live price movement against your entry, SL, and targets.
              </p>
            </div>
            <div className="text-right text-xs text-zinc-600">
              {lastUpdate ? (
                <>
                  <p>Updated {lastUpdate.toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
                  <p className="text-zinc-700">Refresh in {countdown}s</p>
                </>
              ) : null}
            </div>
          </div>

          {/* States */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-64 animate-pulse rounded-3xl border border-zinc-800 bg-zinc-950" />
              ))}
            </div>
          ) : trades.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center">
              <p className="text-3xl">📡</p>
              <h2 className="mt-4 text-xl font-bold text-white">No open trades</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Trades will appear here when the signal engine issues a setup.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {trades.map(trade => (
                <TradeCard key={trade.id} trade={trade} />
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
