import type { ConfidenceLevel } from "@/lib/types";

type ConfidenceBadgeProps = {
  confidence: ConfidenceLevel;
};

export default function ConfidenceBadge({
  confidence,
}: ConfidenceBadgeProps) {
  const styles =
    confidence === "High"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
      : confidence === "Medium"
      ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
      : "border-zinc-700 bg-zinc-800 text-zinc-300";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}
    >
      Confidence: {confidence}
    </span>
  );
}