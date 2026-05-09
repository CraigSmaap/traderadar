"use client";

import Link from "next/link";

export default function PricingPage() {
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

        {/* TRIAL BANNER */}
        <div className="mt-8 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            7-Day Free Trial
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Full Pro access from day one
          </h2>
          <p className="mt-2 text-sm text-zinc-300 max-w-lg mx-auto">
            Sign up and instantly get every Pro feature — live signals, full
            trade plans, lot size calculator, and broker tools. No payment
            details required.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-2xl bg-amber-400 px-8 py-3 text-sm font-bold text-black transition hover:bg-amber-300"
          >
            Start Free Trial
          </Link>
        </div>

        {/* PRICING CARD */}
        <div className="mt-10 max-w-md mx-auto">
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
              <div className="text-3xl font-black text-white">R199/mo</div>
              <p className="mt-1 text-xs text-zinc-500">After your 7-day free trial</p>
            </div>

            <div className="mt-6 space-y-3">
              <a
                href="https://wa.me/27700000000"
                target="_blank"
                className="block w-full rounded-2xl bg-emerald-500 py-3 text-center text-sm font-bold text-black hover:bg-emerald-400 transition"
              >
                Activate Pro (WhatsApp)
              </a>

              <p className="text-xs text-zinc-500 text-center">
                Payments coming soon. Manual activation for now.
              </p>
            </div>
          </div>
        </div>

        {/* TRUST SECTION */}
        <div className="mt-12 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <h3 className="text-lg font-bold text-white">
            Why upgrade after the trial?
          </h3>

          <p className="mt-2 text-sm text-zinc-400 max-w-xl mx-auto">
            The trial gives you everything. Pro keeps it going. Without an
            active subscription after 7 days, all signals and trade plans are
            locked.
          </p>
        </div>

        {/* BACK */}
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
