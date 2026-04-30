import Link from "next/link";
import Header from "@/components/layout/Header";
import PricingPanel from "@/components/ui/PricingPanel";
import RiskGuardrails from "@/components/ui/RiskGuardrails";
import EarlyAccessForm from "@/components/ui/EarlyAccessForm";

const trustPoints = [
  "No charts required",
  "Beginner friendly",
  "Use small risk only",
  "Clear trade plans",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,rgba(24,24,27,0.96)_0%,rgba(6,6,8,0.99)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-10">
          <p className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            TradeRadar
          </p>

          <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Trading made simple for beginners.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
            No charts. No confusion. Just clear BUY / SELL / WAIT trade plans,
            where to enter, where to limit risk, and where to take profit.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-2xl bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-black transition hover:brightness-110"
            >
              Start Free
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

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-red-300">
              Problem
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              Most beginners lose from confusion.
            </h2>

            <p className="mt-3 text-sm leading-7 text-zinc-400">
              Charts are overwhelming. Most people don’t know what to trade,
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

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
              1
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              See what to trade
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              Top ranked setups appear first.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
              2
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Know your risk
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              Use risk limits and lot size tools before trading.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
              3
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Execute simply
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              Copy the plan or open chart tools instantly.
            </p>
          </div>
        </section>

        <div className="mt-8">
          <RiskGuardrails />
        </div>

        <PricingPanel />

        <div className="mt-8">
          <EarlyAccessForm />
        </div>

        <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
          <h2 className="text-2xl font-semibold text-white">
            Ready to stop guessing?
          </h2>

          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Start free and view beginner-friendly live trade plans today.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Start Free
            </Link>

            <Link
              href="/live"
              className="rounded-2xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white"
            >
              View Live Trades
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}