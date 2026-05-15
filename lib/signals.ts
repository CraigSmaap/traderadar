import { createClient } from "@supabase/supabase-js";
import { isExnessAllowedAsset } from "@/lib/types";
import { getAssetSpreadPct } from "@/lib/spreads";

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

function normalizeAsset(value?: string | null) {
  return (value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace("-", "")
    .replace("/", "")
    .trim();
}

function isCryptoAsset(value?: string | null) {
  const asset = normalizeAsset(value);
  return ["BTCUSD", "ETHUSD"].includes(asset);
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

  return price >= low && price <= high;
}

function calculatePnl(signal: SignalResult, price: number) {
  const entry = Number(signal.entry_price || 0);
  if (entry === 0) return 0;
  const diff = signal.direction === "BUY" ? price - entry : entry - price;
  const rawPnl = (diff / entry) * 100;
  // Deduct entry-side spread (half of round-trip); exit spread is accounted
  // for in calculateRiskBasedReturn when the trade closes.
  const entrySpreaderPct = getAssetSpreadPct(signal.asset) / 2;
  return rawPnl - entrySpreaderPct;
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

function getNextStatus(signal: SignalResult, price: number, mover?: Mover) {
  if (isTradeClosed(signal.status)) return signal.status;

  if (isExpired(signal, mover)) {
    return "expired";
  }

  if (signal.status === "waiting") {
    if (isPriceInsideEntryZone(signal, price)) {
      return "open";
    }

    return "waiting";
  }

  if (signal.status === "open") {
    if (signal.direction === "BUY") {
      if (price <= signal.stop_loss) return "sl_hit";
      if (signal.tp3 && price >= signal.tp3) return "tp3_hit";
      if (signal.tp2 && price >= signal.tp2) return "tp2_hit";
      if (signal.tp1 && price >= signal.tp1) return "tp1_hit";
    }

    if (signal.direction === "SELL") {
      if (price >= signal.stop_loss) return "sl_hit";
      if (signal.tp3 && price <= signal.tp3) return "tp3_hit";
      if (signal.tp2 && price <= signal.tp2) return "tp2_hit";
      if (signal.tp1 && price <= signal.tp1) return "tp1_hit";
    }
  }

  return signal.status;
}

export async function updateSignalStatuses(movers: Mover[]) {
  try {
    console.log("STATUS ENGINE EXNESS V3 START");

    const cleanMovers = movers.filter((mover) =>
      isExnessAllowedAsset(normalizeAsset(mover.symbol))
    );

    const { data: signals, error } = await supabase
      .from("signal_results")
      .select("*")
      .in("status", ["waiting", "open"])
      .limit(100);

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
        const cleanAsset = normalizeAsset(signal.asset);

        if (!isExnessAllowedAsset(cleanAsset)) {
          await supabase
            .from("signal_results")
            .update({
              status: "expired",
              result_label: "EXPIRED",
              updated_at: new Date().toISOString(),
            })
            .eq("id", signal.id);

          continue;
        }

        if (isTradeClosed(signal.status)) continue;

        const mover = cleanMovers.find(
          (m) => normalizeAsset(m.symbol) === cleanAsset
        );

        if (!mover || typeof mover.price !== "number") continue;

        const price = mover.price;
        const newStatus = getNextStatus(signal, price, mover);
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

    console.log("STATUS ENGINE EXNESS V3 COMPLETE");
  } catch (err) {
    console.error("STATUS ENGINE ERROR:", err);
  }
}