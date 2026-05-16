import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Trading Signals for Beginners — 7-Day Free Trial",
  description:
    "Get clear BUY/SELL/WAIT trade plans for XAUUSD, EURUSD, GBPUSD and more. No charts needed. 7-day free trial, no card required. Built for Exness traders.",
  alternates: { canonical: "https://traderadar.co.za" },
  openGraph: {
    title: "TradeRadar — Live Forex & Gold Signals for Beginners",
    description:
      "Clear BUY/SELL/WAIT trade plans for Exness traders. 7-day free trial, no card needed.",
    url: "https://traderadar.co.za",
  },
};
import PricingPanel from "@/components/ui/PricingPanel";
import RiskGuardrails from "@/components/ui/RiskGuardrails";
import EarlyAccessForm from "@/components/ui/EarlyAccessForm";
import { createClient } from "@/lib/supabase/server";

async function getLandingStats() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("signal_results")
      .select("status")
      .not("status", "in", "(waiting,open,stale)");

    const closed = data || [];
    const tpHits = closed.filter((r) =>
      ["tp1_hit", "tp2_hit", "tp3_hit"].includes(r.status)
    ).length;
    const slHits = closed.filter((r) => r.status === "sl_hit").length;
    const total = tpHits + slHits;
    const winRate = total === 0 ? 0 : Math.round((tpHits / total) * 100);
    return { winRate, total, tpHits };
  } catch {
    return { winRate: 0, total: 0, tpHits: 0 };
  }
}

const trustPoints = [
  "No charts required",
  "Beginner friendly",
  "Use small risk only",
  "Clear trade plans",
];

export default async function HomePage() {
  const stats = await getLandingStats();

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ── Hero ── */}
        <div className="rounded-[36px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,rgba(24,24,27,0.96)_0%,rgba(6,6,8,0.99)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <p className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              TradeRadar
            </p>
            <p className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              7-day free trial · no card needed
            </p>
          </div>

          <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Trading made simple for beginners.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
            No charts. No confusion. Just clear BUY / SELL / WAIT trade plans,
            where to enter, where to limit risk, and where to take profit.
          </p>

          {stats.total > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-zinc-700 px-4 py-1.5 text-zinc-300">
                {stats.total} signals tracked
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-emerald-300">
                {stats.winRate}% win rate
              </span>
              <span className="rounded-full border border-zinc-700 px-4 py-1.5 text-zinc-300">
                {stats.tpHits} TP hits
              </span>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="rounded-2xl bg-emerald-400 px-6 py-3 text-center text-sm font-bold text-black transition hover:brightness-110"
            >
              Start 7-day free trial
            </Link>

            <Link
              href="/live"
              className="rounded-2xl border border-zinc-700 px-6 py-3 text-center text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
            >
              View Live Trades
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            {trustPoints.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-sm text-zinc-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ── Demo Signal Preview ── */}
        <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Sample Trade Plan
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              This is what you get with every signal
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Full plans including TP2 and TP3 are unlocked during your free trial.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            {/* Signal header */}
            <div className="border-b border-zinc-800 bg-black/40 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    TradeRadar MT5 Setup
                  </p>
                  <h3 className="mt-2 text-xl font-black text-white">XAUUSD — Gold</h3>
                  <p className="mt-1 text-sm text-zinc-400">PRECISION TRADE SETUP</p>
                  <p className="mt-3 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
                    Free trial · full plan active
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 opacity-80">
                    Action
                  </p>
                  <p className="mt-1 text-3xl font-black text-emerald-300">BUY</p>
                </div>
              </div>
            </div>

            {/* Trade plan grid */}
            <div className="grid gap-3 p-5 md:grid-cols-5">
              <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">Entry Zone</p>
                <p className="mt-1 font-bold text-white">2 340 – 2 355</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">Stop Loss</p>
                <p className="mt-1 font-bold text-red-300">2 318</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">TP1</p>
                <p className="mt-1 font-bold text-emerald-300">2 390</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">TP2</p>
                <p className="mt-1 font-bold text-emerald-300">2 415</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">TP3 / Final</p>
                <p className="mt-1 font-bold text-emerald-300">2 440</p>
              </div>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="inline-block rounded-2xl bg-emerald-400 px-8 py-3 text-sm font-bold text-black transition hover:brightness-110"
            >
              Start free — see live signals
            </Link>
            <p className="mt-2 text-xs text-zinc-500">
              7-day free trial · no credit card · cancel anytime
            </p>
          </div>
        </section>

        {/* ── Problem / Solution ── */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-red-300">
              Problem
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              Most beginners lose from confusion.
            </h2>

            <p className="mt-3 text-sm leading-7 text-zinc-400">
              Charts are overwhelming. Most people don&apos;t know what to trade,
              when to enter, or how much to risk.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
              Solution
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              TradeRadar gives clear decisions.
            </h2>

            <p className="mt-3 text-sm leading-7 text-zinc-400">
              Open the app. See the best setups. Follow the trade plan. Manage
              risk properly.
            </p>
          </div>
        </section>

        {/* ── Steps ── */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">1</p>
            <h2 className="mt-2 text-xl font-semibold text-white">See what to trade</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">Top ranked setups appear first.</p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">2</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Know your risk</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">Use risk limits and lot size tools before trading.</p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">3</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Execute simply</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">Copy the plan or open chart tools instantly.</p>
          </div>
        </section>

        <div className="mt-8">
          <RiskGuardrails />
        </div>

        <PricingPanel />

        <div className="mt-8">
          <EarlyAccessForm />
        </div>

        {/* ── Final CTA ── */}
        <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
          <h2 className="text-2xl font-semibold text-white">
            Ready to stop guessing?
          </h2>

          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Start your 7-day free trial — full access, no card needed.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-bold text-black transition hover:brightness-110"
            >
              Start free trial
            </Link>

            <Link
              href="/live"
              className="rounded-2xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white"
            >
              View Live Trades
            </Link>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            R299/mo after trial · cancel anytime · WhatsApp activation
          </p>
        </section>
      </section>
    </main>
  );
}
