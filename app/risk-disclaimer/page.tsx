export default function RiskDisclaimerPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Risk Disclaimer</h1>

      <p className="text-zinc-400 mb-4">
        Trading financial markets involves significant risk.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. High Risk</h2>
      <p className="text-zinc-400">
        You may lose part or all of your invested capital.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. No Guarantees</h2>
      <p className="text-zinc-400">
        TradeRadar does not guarantee profits or successful outcomes.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Use at Your Own Risk</h2>
      <p className="text-zinc-400">
        All trading decisions are your responsibility.
      </p>
    </main>
  );
}