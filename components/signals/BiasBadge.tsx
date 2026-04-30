import type { SignalBias } from "@/lib/types";

type BiasBadgeProps = {
  bias: SignalBias;
};

function getBiasStyles(bias: SignalBias) {
  switch (bias) {
    case "Bullish":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";

    case "Bearish":
      return "border-red-500/20 bg-red-500/10 text-red-300";

    case "Risk-Off":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";

    case "Neutral":
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";

    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

export default function BiasBadge({ bias }: BiasBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${getBiasStyles(
        bias
      )}`}
    >
      {bias}
    </span>
  );
}