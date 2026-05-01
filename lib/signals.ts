import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function calculatePnl(signal: any, price: number) {
  const entry = signal.entry_price;
  const direction = signal.direction;

  const diff =
    direction === "BUY" ? price - entry : entry - price;

  const pnlPercent = entry === 0 ? 0 : (diff / entry) * 100;

  return pnlPercent;
}

function isTradeClosed(status: string) {
  return [
    "tp1_hit",
    "tp2_hit",
    "tp3_hit",
    "sl_hit",
    "expired",
  ].includes(status);
}

export async function updateSignalStatuses(movers: any[]) {
  try {
    console.log("STATUS ENGINE V2 START");

    // ✅ FIXED QUERY (LIMITED + FILTERED)
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

    for (const signal of signals) {
      try {
        // 🔒 Skip closed trades
        if (isTradeClosed(signal.status)) continue;

        const mover = movers.find(
          (m: any) =>
            m.symbol?.toUpperCase() === signal.asset?.toUpperCase()
        );

        if (!mover) continue;

        const price = mover.price;
        let newStatus = signal.status;

        const entry = signal.entry_price;
        const sl = signal.stop_loss;

        // ENTRY LOGIC
        if (signal.status === "waiting") {
          const nearEntry =
            Math.abs(price - entry) / entry < 0.002;

          if (nearEntry) {
            newStatus = "open";
          }
        }

        // BUY LOGIC
        if (signal.direction === "BUY") {
          if (price <= sl) newStatus = "sl_hit";
          else if (signal.tp3 && price >= signal.tp3) newStatus = "tp3_hit";
          else if (signal.tp2 && price >= signal.tp2) newStatus = "tp2_hit";
          else if (signal.tp1 && price >= signal.tp1) newStatus = "tp1_hit";
        }

        // SELL LOGIC
        if (signal.direction === "SELL") {
          if (price >= sl) newStatus = "sl_hit";
          else if (signal.tp3 && price <= signal.tp3) newStatus = "tp3_hit";
          else if (signal.tp2 && price <= signal.tp2) newStatus = "tp2_hit";
          else if (signal.tp1 && price <= signal.tp1) newStatus = "tp1_hit";
        }

        // 🚀 CRITICAL FIX (SKIP IF NO CHANGE)
        if (newStatus === signal.status) continue;

        // 📊 Calculate PnL
        const pnl = calculatePnl(signal, price);

        // 🏁 Result label
        let resultLabel = "RUNNING";

        if (newStatus.includes("tp")) resultLabel = "WIN";
        if (newStatus === "sl_hit") resultLabel = "LOSS";
        if (newStatus === "expired") resultLabel = "EXPIRED";

        // 💾 Update DB
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

    console.log("STATUS ENGINE V2 COMPLETE");
  } catch (err) {
    console.error("STATUS ENGINE ERROR:", err);
  }
}