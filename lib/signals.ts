import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Mover = {
  symbol: string;
  price: number;
  assetClass?: string;
  volatilityScore?: number;
  momentumScore?: number;
};

type SignalResult = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  entry_zone_low?: number;
  entry_zone_high?: number;
  stop_loss: number;
  tp1?: number | null;
  tp2?: number | null;
  tp3?: number | null;
  status: string;
  created_at: string;
  asset_class?: string | null;
};

function normalizeAsset(value?: string) {
  return (value || "").toUpperCase().replace("/", "").trim();
}

function isCryptoAsset(value?: string) {
  const asset = normalizeAsset(value);

  return [
    "BTC",
    "BTCUSD",
    "ETH",
    "ETHUSD",
    "SOL",
    "SOLUSD",
    "XRP",
    "XRPUSD",
  ].includes(asset);
}

function getExpiryHours(signal: SignalResult, mover?: Mover) {
  const volatility = Number(mover?.volatilityScore || 0);
  const momentum = Number(mover?.momentumScore || 0);
  const crypto = isCryptoAsset(signal.asset) || signal.asset_class === "crypto";

  if (crypto) {
    if (volatility >= 75 || momentum >= 75) return 12;
    return 8;
  }

  if (volatility >= 75 || momentum >= 75) return 8;

  return 6;
}

function isExpired(signal: SignalResult, mover?: Mover) {
  const created = new Date(signal.created_at).getTime();
  const now = Date.now();
  const expiryHours = getExpiryHours(signal, mover);

  return now - created > 1000 * 60 * 60 * expiryHours;
}

function isPriceInsideEntryZone(signal: SignalResult, price: number) {
  const entry = Number(signal.entry_price || 0);

  const zoneLow =
    typeof signal.entry_zone_low === "number" ? signal.entry_zone_low : entry;

  const zoneHigh =
    typeof signal.entry_zone_high === "number" ? signal.entry_zone_high : entry;

  const low = Math.min(zoneLow, zoneHigh);
  const high = Math.max(zoneLow, zoneHigh);

  if (low === 0 && high === 0) return false;

  const inZone = price >= low && price <= high;

  if (!inZone) return false;

  const zoneSize = Math.abs(high - low) || entry * 0.002;
  const buffer = zoneSize * 0.25;

  if (signal.direction === "BUY") {
    return price > low + buffer;
  }

  if (signal.direction === "SELL") {
    return price < high - buffer;
  }

  return false;
}

function calculatePnl(signal: SignalResult, price: number) {
  const entry = Number(signal.entry_price || 0);
  const diff = signal.direction === "BUY" ? price - entry : entry - price;

  return entry === 0 ? 0 : (diff / entry) * 100;
}

function isTradeClosed(status: string) {
  return ["tp1_hit", "tp2_hit", "tp3_hit", "sl_hit", "expired"].includes(
    status
  );
}

function getResultLabel(status: string) {
  if (status === "tp1_hit" || status === "tp2_hit" || status === "tp3_hit") {
    return "WIN";
  }

  if (status === "sl_hit") return "LOSS";
  if (status === "expired") return "EXPIRED";
  if (status === "waiting") return "WAITING";

  return "RUNNING";
}

export async function updateSignalStatuses(movers: Mover[]) {
  try {
    console.log("STATUS ENGINE SMART EXPIRY V2 START");

    const { data: signals, error } = await supabase
      .from("signal_results")
      .select("*")
      .in("status", ["waiting", "open"])
      .limit(50);

    if (error) {
      console.error("FETCH ERROR:", error);
      return;
    }

    if (!signals || signals.length === 0) {
      console.log("No signals to update");
      return;
    }

    console.log("Signals found:", signals.length);

    for (const signal of signals as SignalResult[]) {
      try {
        if (isTradeClosed(signal.status)) continue;

        const mover = movers.find(
          (m) => normalizeAsset(m.symbol) === normalizeAsset(signal.asset)
        );

        if (!mover || typeof mover.price !== "number") continue;

        const price = mover.price;
        let newStatus = signal.status;

        if (signal.status === "waiting" && isExpired(signal, mover)) {
          newStatus = "expired";
        }

        if (
          signal.status === "waiting" &&
          newStatus !== "expired" &&
          isPriceInsideEntryZone(signal, price)
        ) {
          newStatus = "open";
        }

        if (newStatus === "open") {
          if (signal.direction === "BUY") {
            if (price <= signal.stop_loss) newStatus = "sl_hit";
            else if (signal.tp3 && price >= signal.tp3) newStatus = "tp3_hit";
            else if (signal.tp2 && price >= signal.tp2) newStatus = "tp2_hit";
            else if (signal.tp1 && price >= signal.tp1) newStatus = "tp1_hit";
          }

          if (signal.direction === "SELL") {
            if (price >= signal.stop_loss) newStatus = "sl_hit";
            else if (signal.tp3 && price <= signal.tp3) newStatus = "tp3_hit";
            else if (signal.tp2 && price <= signal.tp2) newStatus = "tp2_hit";
            else if (signal.tp1 && price <= signal.tp1) newStatus = "tp1_hit";
          }
        }

        if (newStatus === signal.status) continue;

        const pnl = calculatePnl(signal, price);
        const resultLabel = getResultLabel(newStatus);

        await supabase
          .from("signal_results")
          .update({
            status: newStatus,
            last_price: price,
            pnl_percent: pnl,
            result_label: resultLabel,
            updated_at: new Date().toISOString(),
          })
          .eq("id", signal.id);
      } catch (innerErr) {
        console.error("Signal error:", innerErr);
      }
    }

    console.log("STATUS ENGINE SMART EXPIRY V2 COMPLETE");
  } catch (err) {
    console.error("STATUS ENGINE ERROR:", err);
  }
}