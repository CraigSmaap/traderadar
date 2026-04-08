import BiasBadge from "@/components/signals/BiasBadge";
import ConfidenceBadge from "@/components/signals/ConfidenceBadge";
import type { TradeSignal } from "@/lib/types";
import { getTradeLink } from "@/lib/utils";

type SignalCardProps = {
  signal: TradeSignal;
};

function getStatusStyles(status: TradeSignal["status"]) {
  if (status === "published") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-300";
}

function formatRelativeTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

function getTradeRedirectLink(signal: TradeSignal) {
  const joined = (signal.assets || []).join(" ").toUpperCase();

  const assetKey =
    joined.includes("USD/ZAR") || joined.includes("USDZAR") || joined.includes("RAND")
      ? "USDZAR"
      : joined.includes("XAU") || joined.includes("GOLD") || joined.includes("BULLION")
      ? "XAUUSD"
      : joined.includes("J200") || joined.includes("TOP 40") || joined.includes("JSE TOP 40")
      ? "J200"
      : joined.includes("NASPERS") || joined.includes("NPN")
      ? "NPN"
      : joined.includes("PROSUS") || joined.includes("PRX")
      ? "PRX"
      : joined.includes("ANGLO") || joined.includes("AGL")
      ? "AGL"
      : joined.includes("BHP") || joined.includes("BHG")
      ? "BHG"
      : joined.includes("GOLD FIELDS") || joined.includes("GFI")
      ? "GFI"
      : joined.includes("HARMONY") || joined.includes("HAR")
      ? "HAR"
      : joined.includes("SASOL") || joined.includes("SOL")
      ? "SOL"
      : joined.includes("MTN")
      ? "MTN"
      : joined.includes("VODACOM") || joined.includes("VOD")
      ? "VOD"
      : joined.includes("SHOPRITE") || joined.includes("SHP")
      ? "SHP"
      : joined.includes("FIRSTRAND") || joined.includes("FIRST RAND") || joined.includes("FSR")
      ? "FSR"
      : joined.includes("STANDARD BANK") || joined.includes("SBK")
      ? "SBK"
      : joined.includes("ABSA") || joined.includes("ABG")
      ? "ABG"
      : joined.includes("NEDBANK") || joined.includes("NED")
      ? "NED"
      : "USDZAR";

  return `/api/redirect?asset=${encodeURIComponent(assetKey)}&type=trade`;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const statusStyles = getStatusStyles(signal.status);
  const relativeTime = formatRelativeTime(signal.timestamp);
  const exactTime = new Date(signal.timestamp).toLocaleString();

  const panel =
    "rounded-2xl border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(6,6,8,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

  return (
    <article className="group overflow-hidden rounded-3xl border border-zinc-800/90 bg-[linear-gradient(180deg,rgba(20,20,22,0.96)_0%,rgba(6,6,8,0.99)_100%)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_rgba(0,0,0,0.45)] transition duration-200 hover:border-zinc-700">
      <div className="border-b border-zinc-800/80 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_30%),linear-gradient(180deg,rgba(20,20,22,0.96)_0%,rgba(10,10,12,0.98)_100%)] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300">
                  Macro Signal
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusStyles}`}
                >
                  {signal.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold leading-tight text-white sm:text-xl">
                {signal.category}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                <span>
                  {signal.region} · {signal.source}
                </span>
                <span className="text-zinc-600">•</span>
                <span title={exactTime}>{relativeTime}</span>
              </div>
            </div>

            <div className="shrink-0">
              <ConfidenceBadge confidence={signal.confidence} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className={panel}>
              <div className="px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Bias
                </div>
                <div className="mt-2">
                  <BiasBadge bias={signal.bias} />
                </div>
              </div>
            </div>

            <div className={`${panel} sm:col-span-2`}>
              <div className="px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Assets to watch
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {signal.assets.map((asset) => (
                    <span
                      key={asset}
                      className="rounded-full border border-zinc-700/80 bg-[linear-gradient(180deg,rgba(34,34,36,0.92)_0%,rgba(12,12,14,0.96)_100%)] px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <section className={panel}>
          <div className="px-4 py-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Event
            </div>
            <p className="text-sm leading-7 text-zinc-100">{signal.event}</p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className={panel}>
            <div className="px-4 py-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Global market impact
              </div>
              <p className="text-sm leading-7 text-zinc-300">{signal.impact}</p>
            </div>
          </div>

          <div className={panel}>
            <div className="px-4 py-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                South Africa impact
              </div>
              <p className="text-sm leading-7 text-zinc-300">{signal.saImpact}</p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-zinc-800/80 pt-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Opportunity active · market reacting now
          </div>

          {signal.status === "published" ? (
            
             <div className="grid gap-3 sm:grid-cols-2">
  <button
    onClick={() => {
      try {
        const existing = window.localStorage.getItem("tradeClicks");
        const parsed = existing ? JSON.parse(existing) : [];

        parsed.push({
  asset: signal.assets[0] || "unknown",
  type: "trade",
  time: new Date().toISOString(),
});

        window.localStorage.setItem("tradeClicks", JSON.stringify(parsed));
      } catch {}
const asset = (signal.assets[0] || "").toUpperCase().replace("/", "");

const chartUrl = `https://www.tradingview.com/chart/?symbol=${
  asset.includes("ZAR") ? "OANDA:USDZAR" :
  asset.includes("XAU") || asset.includes("GOLD") ? "OANDA:XAUUSD" :
  asset.includes("J200") || asset.includes("TOP") ? "JSE:J200" :
  asset.includes("NPN") ? "JSE:NPN" :
  asset.includes("PRX") ? "JSE:PRX" :
  asset.includes("AGL") ? "JSE:AGL" :
  asset.includes("BHG") ? "JSE:BHG" :
  asset.includes("GFI") ? "JSE:GFI" :
  asset.includes("HAR") ? "JSE:HAR" :
  asset.includes("SOL") ? "JSE:SOL" :
  asset.includes("MTN") ? "JSE:MTN" :
  asset.includes("VOD") ? "JSE:VOD" :
  asset.includes("SHP") ? "JSE:SHP" :
  asset.includes("FSR") ? "JSE:FSR" :
  asset.includes("SBK") ? "JSE:SBK" :
  asset.includes("ABG") ? "JSE:ABG" :
  asset.includes("NED") ? "JSE:NED" :
  "OANDA:USDZAR"
}`;

window.open(chartUrl, "_blank");
      
    }}
    className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-[linear-gradient(180deg,rgba(24,24,26,0.92)_0%,rgba(10,10,12,0.98)_100%)] px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
  >
    View Chart
  </button>

  <button
    onClick={() => {
      try {
        const existing = window.localStorage.getItem("tradeClicks");
        const parsed = existing ? JSON.parse(existing) : [];

        parsed.push({
          asset: signal.assets[0] || "unknown",
          type: "trade",
          time: new Date().toISOString(),
        });

        window.localStorage.setItem("tradeClicks", JSON.stringify(parsed));
      } catch {}

      window.open(getTradeRedirectLink(signal), "_blank");
    }}
    className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.96)_0%,rgba(5,150,105,0.96)_100%)] px-4 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(16,185,129,0.22)] transition hover:brightness-110"
  >
    Trade This
  </button>
   </div>
          ) : (
            <div className="rounded-full border border-zinc-700 bg-[linear-gradient(180deg,rgba(24,24,26,0.92)_0%,rgba(10,10,12,0.98)_100%)] px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
              Draft signal
            </div>
          )}
        </div>
      </div>
    </article>
  );
}