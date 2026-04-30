type ConfidenceBadgeProps = {
  confidence: "High" | "Medium" | "Low";
};

function getConfidenceStyles(confidence: ConfidenceBadgeProps["confidence"]) {
  switch (confidence) {
    case "High":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "Medium":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
    case "Low":
      return "border-red-500/20 bg-red-500/10 text-red-300";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

function getStrengthLabel(
  confidence: ConfidenceBadgeProps["confidence"]
) {
  switch (confidence) {
    case "High":
      return "Strong";
    case "Medium":
      return "Good";
    case "Low":
      return "Weak";
    default:
      return confidence;
  }
}

export default function ConfidenceBadge({
  confidence,
}: ConfidenceBadgeProps) {
  return (
    <div
      className={`inline-flex min-w-[110px] flex-col rounded-2xl border px-4 py-3 ${getConfidenceStyles(
        confidence
      )}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
        Strength
      </span>

      <span className="mt-1 text-sm font-semibold uppercase tracking-[0.14em]">
        {getStrengthLabel(confidence)}
      </span>
    </div>
  );
}