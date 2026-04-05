const alerts = [
  "Iran tension ↑ → Oil bullish",
  "US inflation hot → USD strength",
  "China stimulus watch → Metals in focus",
  "Risk sentiment weak → Rand pressure",
];

export default function LiveAlertsBar() {
  return (
    <div className="border border-yellow-500/20 bg-yellow-500/10 rounded-2xl px-4 py-3 mb-5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-400">
        Live Alerts
      </div>

      <div className="flex flex-wrap gap-2">
        {alerts.map((alert) => (
          <span
            key={alert}
            className="rounded-full border border-yellow-500/20 bg-black/40 px-3 py-1 text-xs text-yellow-100"
          >
            {alert}
          </span>
        ))}
      </div>
    </div>
  );
}