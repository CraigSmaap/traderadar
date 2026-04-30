export default function RiskGuardrails() {
  return (
    <section className="mb-8 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
        Risk Warning
      </p>

      <h2 className="mt-2 text-xl font-semibold text-white">
        Trade plans are educational, not guaranteed signals.
      </h2>

      <div className="mt-4 grid gap-3 text-sm leading-6 text-amber-100/90 md:grid-cols-2">
        <p>
          Never risk money you cannot afford to lose. Markets can move against
          any setup.
        </p>

        <p>
          Suggested lot size is only a risk guide. Always confirm values with
          your broker before entering.
        </p>

        <p>
          Recommended risk per trade: 0.5% to 2% of account balance.
        </p>

        <p>
          Avoid trading during major news unless you understand volatility and
          slippage risk.
        </p>
      </div>
    </section>
  );
}