"use client";

import Header from "@/components/layout/Header";
import Link from "next/link";

export default function RiskDisclaimerPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-4xl px-6 py-10">
        {/* Back Button */}
        <Link
          href="/live"
          className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-400 mb-6"
        >
          ← Back to Live
        </Link>

        <h1 className="text-3xl font-bold mb-6">Risk Disclaimer</h1>

        <p className="text-zinc-400 mb-4">
          Trading financial markets involves significant risk and is not suitable
          for all investors.
        </p>

        {/* SECTION 1 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">1. High Risk</h2>
        <p className="text-zinc-400">
          You may lose part or all of your invested capital. Trading leveraged
          instruments such as forex, crypto, and indices carries a high level of
          risk.
        </p>

        {/* SECTION 2 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">2. No Guarantees</h2>
        <p className="text-zinc-400">
          TradeRadar does not guarantee profits or successful outcomes. Past
          performance does not guarantee future results.
        </p>

        {/* SECTION 3 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          3. Educational Purpose Only
        </h2>
        <p className="text-zinc-400">
          All content, signals, and trade plans provided by TradeRadar are for
          educational and informational purposes only and should not be
          considered financial advice.
        </p>

        {/* SECTION 4 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          4. User Responsibility
        </h2>
        <p className="text-zinc-400">
          You are solely responsible for your trading decisions. Always conduct
          your own analysis and confirm information before executing any trade.
        </p>

        {/* SECTION 5 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          5. Platform Limitations
        </h2>
        <p className="text-zinc-400">
          TradeRadar relies on third-party data and automated systems. Prices,
          signals, or performance data may be delayed, inaccurate, or incomplete.
        </p>

        {/* SECTION 6 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          6. No Liability
        </h2>
        <p className="text-zinc-400">
          TradeRadar and its operators are not liable for any financial losses,
          damages, or decisions made based on the use of this platform.
        </p>

        {/* Footer */}
        <p className="text-xs text-zinc-600 mt-10">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </section>
    </main>
  );
}