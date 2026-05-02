"use client";

import Header from "@/components/layout/Header";
import Link from "next/link";

export default function TermsPage() {
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

        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

        <p className="text-zinc-400 mb-4">
          By using TradeRadar, you agree to the following terms.
        </p>

        {/* SECTION 1 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          1. No Financial Advice
        </h2>
        <p className="text-zinc-400">
          TradeRadar provides educational market analysis, trade setups, and
          insights. It does not provide financial, investment, or trading advice.
          Past performance does not guarantee future results.
        </p>

        {/* SECTION 2 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          2. User Responsibility
        </h2>
        <p className="text-zinc-400">
          You are fully responsible for your trading decisions and any financial
          outcomes. You should always verify information independently before
          executing any trade.
        </p>

        {/* SECTION 3 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          3. Platform Limitations
        </h2>
        <p className="text-zinc-400">
          TradeRadar relies on external data sources and automated systems.
          Information may be delayed, inaccurate, or incomplete. The platform may
          experience downtime or interruptions.
        </p>

        {/* SECTION 4 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          4. Access Levels
        </h2>
        <p className="text-zinc-400">
          Features differ between Free and Pro accounts. Access levels and
          features may change at any time without notice.
        </p>

        {/* SECTION 5 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          5. Account Usage
        </h2>
        <p className="text-zinc-400">
          You may not share accounts, abuse the system, or attempt to manipulate
          platform data or behavior.
        </p>

        {/* SECTION 6 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          6. Limitation of Liability
        </h2>
        <p className="text-zinc-400">
          TradeRadar and its operators are not liable for any financial losses,
          damages, or decisions made based on the use of the platform.
        </p>

        {/* SECTION 7 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          7. No Brokerage Services
        </h2>
        <p className="text-zinc-400">
          TradeRadar is not a broker and does not execute trades on behalf of
          users.
        </p>

        {/* SECTION 8 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">8. Changes</h2>
        <p className="text-zinc-400">
          These terms may be updated at any time without prior notice.
        </p>
      </section>
    </main>
  );
}