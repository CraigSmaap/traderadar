import type { SignalBias } from "@/lib/types";

type BiasBadgeProps = {
  bias: SignalBias;
};

export default function BiasBadge({ bias }: BiasBadgeProps) {
  const styles =
    bias === "Bullish"
      ? "border-green-500/20 bg-green-500/10 text-green-400"
      : bias === "Bearish"
      ? "border-red-500/20 bg-red-500/10 text-red-400"
      : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles}`}
    >
      {bias}
    </span>
  );
}