export default function PricingPanel() {
  return (
    <section className="mb-8 grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          7-Day Free Trial
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Full access, no card required
        </h2>

        <p className="mt-2 text-sm leading-7 text-zinc-400">
          Every new account starts with 7 days of full Pro access — no payment
          needed to get started.
        </p>

        <ul className="mt-5 space-y-3 text-sm text-zinc-300">
          <li>✓ All live trade setups</li>
          <li>✓ Full trade plans (TP1, TP2, TP3)</li>
          <li>✓ Lot size calculator</li>
          <li>✓ Signal alerts</li>
          <li>✓ Broker execution tools</li>
        </ul>
      </div>

      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Pro
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Continue after your trial
        </h2>

        <p className="mt-2 text-sm leading-7 text-zinc-300">
          Keep every feature active with a Pro subscription after your 7-day
          trial ends.
        </p>

        <ul className="mt-5 space-y-3 text-sm text-zinc-200">
          <li>✓ Everything in the trial, forever</li>
          <li>✓ Priority signals</li>
          <li>✓ Advanced broker tools</li>
          <li>✓ Full performance analytics</li>
        </ul>

        <a
          href="/pricing"
          className="mt-6 inline-block rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
        >
          View Pricing
        </a>
      </div>
    </section>
  );
}
