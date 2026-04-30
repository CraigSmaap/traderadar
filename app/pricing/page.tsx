"use client";

import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black text-white text-center">
          Upgrade to Pro
        </h1>

        <p className="mt-3 text-center text-zinc-400 max-w-2xl mx-auto">
          Unlock full trade plans, deeper targets, and risk tools. Trade smarter
          with complete information.
        </p>

        {/* PRICING CARDS */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* FREE */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-xl font-bold text-white">Free</h2>

            <p className="mt-2 text-zinc-400 text-sm">
              Basic access for beginners
            </p>

            <div className="mt-6 space-y-3 text-sm text-zinc-300">
              <p>✔ Entry zones</p>
              <p>✔ Stop loss</p>
              <p>✔ TP1 only</p>
              <p>✔ Basic signals</p>
              <p className="text-zinc-500">✖ TP2 locked</p>
              <p className="text-zinc-500">✖ TP3 locked</p>
              <p className="text-zinc-500">✖ Lot size calculator</p>
            </div>

            <div className="mt-6">
              <button className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-bold text-zinc-400 cursor-default">
                Current Plan
              </button>
            </div>
          </div>

          {/* PRO */}
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-emerald-300">Pro</h2>

            <p className="mt-2 text-zinc-400 text-sm">
              Full trading decision engine
            </p>

            <div className="mt-6 space-y-3 text-sm text-zinc-200">
              <p>✔ Full trade plan</p>
              <p>✔ TP1, TP2, TP3</p>
              <p>✔ Best setups priority</p>
              <p>✔ Lot size calculator</p>
              <p>✔ Copy full trade plan</p>
              <p>✔ Advanced signals</p>
            </div>

            <div className="mt-6">
              <div className="text-3xl font-black text-white">R199/mo</div>
            </div>

            <div className="mt-6 space-y-3">
              {/* TEMP CTA */}
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
            Why upgrade?
          </h3>

          <p className="mt-2 text-sm text-zinc-400 max-w-xl mx-auto">
            Free shows you direction. Pro shows you the full execution plan.
            Without TP2 & TP3, you&apos;re trading blind on exits.
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