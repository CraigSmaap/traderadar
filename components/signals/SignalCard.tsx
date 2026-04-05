import TradeThisButton from "@/components/signals/TradeThisButton";
import BiasBadge from "@/components/signals/BiasBadge";
import ConfidenceBadge from "@/components/signals/ConfidenceBadge";
import type { TradeSignal } from "@/lib/types";
import { getTradeLink } from "@/lib/utils";

type SignalCardProps = {
  signal: TradeSignal;
};

export default function SignalCard({ signal }: SignalCardProps) {
  const statusStyles =
    signal.status === "published"
      ? "border-green-500/20 bg-green-500/10 text-green-400"
      : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-white shadow-lg sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[11px] font-semibold tracking-wide text-red-400 sm:text-xs">
            🚨 {signal.category}
          </div>

          <span className="rounded-full border border-zinc-700 bg-black px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-400">
            {signal.source}
          </span>

          <span className="rounded-full border border-zinc-700 bg-black px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-400">
            {signal.region}
          </span>

          <span
            className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${statusStyles}`}
          >
            {signal.status}
          </span>
        </div>

        <div className="self-start sm:self-auto">
          <ConfidenceBadge confidence={signal.confidence} />
        </div>
      </div>

      <div className="space-y-3 text-sm leading-6">
        <p>
          <span className="text-zinc-400">Event:</span> {signal.event}
        </p>

        <p>
          <span className="text-zinc-400">Market Impact:</span> {signal.impact}
        </p>

        <p>
          <span className="text-zinc-400">SA Impact:</span> {signal.saImpact}
        </p>

        <div>
          <span className="text-zinc-400">Assets to Watch:</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {signal.assets.map((asset) => (
              <span
                key={asset}
                className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-xs text-zinc-300"
              >
                {asset}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <BiasBadge bias={signal.bias} />
      </div>

      <div className="mt-4 text-[11px] text-zinc-500">
        ⏱ Opportunity active — market reacting now
      </div>

      {signal.status === "published" && (
        <TradeThisButton
          href={getTradeLink(signal.assets)}
          asset={signal.assets[0]}
        />
      )}
    </article>
  );
}