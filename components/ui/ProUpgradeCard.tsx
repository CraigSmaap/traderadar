export default function ProUpgradeCard() {
  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
        TradeRadar Pro
      </p>

      <h2 className="mt-2 text-2xl font-semibold text-white">
        Unlock all live trade plans.
      </h2>

      <p className="mt-3 text-sm leading-7 text-zinc-300">
        Free users see limited setups. Pro unlocks all best trades, final
        targets, lot sizing, broker tools, alerts, and premium trade features.
      </p>

      <button className="mt-5 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110">
        Upgrade to Pro
      </button>
    </div>
  );
}