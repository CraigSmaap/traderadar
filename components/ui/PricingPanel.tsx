export default function PricingPanel() {
  return (
    <section className="mb-8 grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Free
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Start with 3 trades
        </h2>

        <p className="mt-2 text-sm leading-7 text-zinc-400">
          Good for testing TradeRadar and learning how the trade plans work.
        </p>

        <ul className="mt-5 space-y-3 text-sm text-zinc-300">
          <li>✓ 3 visible trade setups</li>
          <li>✓ Basic trade direction</li>
          <li>✓ Where to enter</li>
          <li>✓ Risk limit</li>
          <li>✓ First + Second Target only</li>
          <li>✓ Limited tools</li>
        </ul>
      </div>

      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Pro
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Unlock full trade plans
        </h2>

        <p className="mt-2 text-sm leading-7 text-zinc-300">
          Built for users who want more setups, clearer risk control, and full
          execution tools.
        </p>

        <ul className="mt-5 space-y-3 text-sm text-zinc-200">
          <li>✓ All trade setups</li>
          <li>✓ Full Profit Targets</li>
          <li>✓ Lot size calculator</li>
          <li>✓ Alerts engine</li>
          <li>✓ Broker tools</li>
          <li>✓ Priority signals</li>
        </ul>
      </div>
    </section>
  );
}