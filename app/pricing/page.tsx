"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EXNESS_AFFILIATE_URL } from "@/lib/access";

type PerfStats = {
  winRate?: number;
  total?: number;
  wins?: number;
};

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [stats, setStats] = useState<PerfStats | null>(null);
  const [exnessClicked, setExnessClicked] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/performance", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: PerfStats) => setStats(data))
      .catch(() => {});

    setExnessClicked(localStorage.getItem("tr-exness-clicked") === "1");
  }, []);

  async function handleExnessClick() {
    localStorage.setItem("tr-exness-clicked", "1");
    setExnessClicked(true);
    window.open(EXNESS_AFFILIATE_URL, "_blank");
  }

  async function handleClaimTrial() {
    setClaiming(true);
    setClaimError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setClaimError("Sign in first to claim your trial.");
        setClaiming(false);
        return;
      }
      const res = await fetch("/api/claim-exness-trial", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setClaimError(json.error || "Something went wrong.");
      } else {
        setClaimed(true);
      }
    } catch {
      setClaimError("Network error. Please try again.");
    } finally {
      setClaiming(false);
    }
  }

  const monthlyPrice = 499;
  const annualMonthly = 224;
  const annualTotal = annualMonthly * 12;

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black text-white text-center">
          Start Free. Upgrade When Ready.
        </h1>

        <p className="mt-3 text-center text-zinc-400 max-w-2xl mx-auto">
          Every new account gets 7 days of full Pro access — no card required.
          After your trial, upgrade to Pro to keep all features.
        </p>

        {/* LIVE STATS TRUST BAR */}
        {stats && (stats.total ?? 0) > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <span className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
              {stats.total} signals tracked
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              {stats.winRate}% win rate
            </span>
            <span className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
              {stats.wins} TP hits
            </span>
          </div>
        )}

        {/* EXNESS 30-DAY TRIAL */}
        <div className="mt-8 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Open Exness Account → Get 30-Day Free Trial
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Trade on Exness. Get 30 days free.
          </h2>
          <p className="mt-2 text-sm text-zinc-300 max-w-lg mx-auto">
            Open a free Exness trading account through our link — then claim your
            30-day TradeRadar trial. No subscription needed during your trial.
          </p>

          {claimed ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 inline-block">
              <p className="text-emerald-300 font-bold">30-day trial activated!</p>
              <p className="mt-1 text-xs text-zinc-400">Reload the app to see your updated access.</p>
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-3">
              <button
                onClick={handleExnessClick}
                className="rounded-2xl bg-emerald-500 px-8 py-3 text-sm font-bold text-black transition hover:bg-emerald-400"
              >
                Open Free Exness Account →
              </button>

              {exnessClicked && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-zinc-400">
                    Done signing up? Claim your 30-day trial:
                  </p>
                  <button
                    onClick={handleClaimTrial}
                    disabled={claiming}
                    className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {claiming ? "Activating…" : "Claim 30-Day Trial"}
                  </button>
                  {claimError && (
                    <p className="text-xs text-red-400">{claimError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="mt-3 text-xs text-zinc-500">
            No card required · Honor-based · Exness account is free to open
          </p>
        </div>

        {/* 7-DAY TRIAL BANNER */}
        <div className="mt-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            Or: 7-Day Free Trial
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">
            Start without Exness
          </h2>
          <p className="mt-2 text-sm text-zinc-300 max-w-lg mx-auto">
            Sign up and get 7 days of full Pro access — no card required.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-2xl bg-amber-400 px-8 py-3 text-sm font-bold text-black transition hover:bg-amber-300"
          >
            Start 7-Day Trial
          </Link>
          <p className="mt-2 text-xs text-zinc-500">
            No card · cancel anytime
          </p>
        </div>

        {/* BILLING TOGGLE */}
        <div className="mt-10 flex justify-center">
          <div className="flex rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                billing === "monthly"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                billing === "annual"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Annual
              <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
                25% off
              </span>
            </button>
          </div>
        </div>

        {/* PRICING CARD */}
        <div className="mt-6 max-w-md mx-auto">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-emerald-300">Pro</h2>

            <p className="mt-2 text-zinc-400 text-sm">
              Full trading decision engine
            </p>

            <div className="mt-6 space-y-3 text-sm text-zinc-200">
              <p>✔ All live trade setups</p>
              <p>✔ Full trade plans (TP1, TP2, TP3)</p>
              <p>✔ Lot size calculator</p>
              <p>✔ Copy full trade plan</p>
              <p>✔ Signal alerts</p>
              <p>✔ Broker execution tools</p>
              <p>✔ Full performance analytics</p>
            </div>

            <div className="mt-6">
              {billing === "monthly" ? (
                <div>
                  <div className="text-3xl font-black text-white">
                    R{monthlyPrice}/mo
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    After your free trial
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-black text-white">
                    R{annualMonthly}/mo
                  </div>
                  <p className="mt-1 text-xs text-emerald-400">
                    Billed annually (R{annualTotal}/yr) — save R{(monthlyPrice - annualMonthly) * 12}/yr
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    After your free trial
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <a
                href="mailto:hiveopps.core@gmail.com?subject=TradeRadar Pro Activation"
                className="block w-full rounded-2xl bg-emerald-500 py-3 text-center text-sm font-bold text-black hover:bg-emerald-400 transition"
              >
                Activate Pro — Email us
              </a>

              <p className="text-xs text-zinc-500 text-center">
                We&apos;ll activate your account within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* WHY UPGRADE */}
        <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <h3 className="text-lg font-bold text-white">
            Why upgrade after the trial?
          </h3>

          <p className="mt-2 text-sm text-zinc-400 max-w-xl mx-auto">
            The trial gives you everything. Pro keeps it going. Without an
            active subscription after 7 days, all signals and trade plans are
            locked. That&apos;s R6.60/day to keep your edge.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/live"
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Back to signals
          </Link>
        </div>
      </div>
    </main>
  );
}
