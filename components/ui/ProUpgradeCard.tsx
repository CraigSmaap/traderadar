export default function ProUpgradeCard() {
  return (
    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
        Trial Ended
      </p>

      <h2 className="mt-2 text-2xl font-semibold text-white">
        Upgrade to see all live trade plans.
      </h2>

      <p className="mt-3 text-sm leading-7 text-zinc-300">
        Your 7-day free trial has ended. Upgrade to Pro to continue receiving
        live signals, full trade plans, the lot size calculator, and all broker
        execution tools.
      </p>

      <a
        href="/pricing"
        className="mt-5 inline-block rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
      >
        Upgrade to Pro
      </a>
    </div>
  );
}
