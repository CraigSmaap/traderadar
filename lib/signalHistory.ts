import { createClient } from "@/lib/supabase/client";
import type { TradeSignal } from "@/lib/types";
import { isExnessAllowedAsset } from "@/lib/types";

export type SignalHistoryItem = TradeSignal & {
  savedAt: string;
};

function normalizeAsset(value?: string | null) {
  return (value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace("-", "")
    .replace("/", "")
    .trim();
}

export async function getSignalHistory(): Promise<SignalHistoryItem[]> {
  if (typeof window === "undefined") return [];

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("signal_history")
    .select("signal_data,saved_at")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false })
    .limit(100);

  if (!data) return [];

  return data
    .map((item) => ({
      ...(item.signal_data as TradeSignal),
      savedAt: item.saved_at,
    }))
    .filter((signal) =>
      isExnessAllowedAsset(normalizeAsset(signal.primaryAsset))
    );
}

export async function saveSignalHistory(signals: TradeSignal[]) {
  if (typeof window === "undefined") return;

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || signals.length === 0) return;

  // 🔒 FILTER BEFORE SAVING
  const cleanSignals = signals.filter((signal) =>
    isExnessAllowedAsset(normalizeAsset(signal.primaryAsset))
  );

  if (cleanSignals.length === 0) return;

  await supabase.from("signal_history").upsert(
    cleanSignals.map((signal) => ({
      user_id: user.id,
      signal_id: signal.id,
      signal_data: signal,
      saved_at: new Date().toISOString(),
    })),
    {
      onConflict: "user_id,signal_id",
      ignoreDuplicates: true,
    }
  );

  window.dispatchEvent(new Event("traderadar-signal-history-changed"));
}

export async function clearSignalHistory() {
  if (typeof window === "undefined") return;

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("signal_history").delete().eq("user_id", user.id);

  window.dispatchEvent(new Event("traderadar-signal-history-changed"));
}