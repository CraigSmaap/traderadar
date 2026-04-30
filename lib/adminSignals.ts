import { createClient } from "@/lib/supabase/client";
import type { TradeSignal } from "@/lib/types";

export async function getHiddenSignalIds() {
  if (typeof window === "undefined") return [];

  const supabase = createClient();

  const { data } = await supabase
    .from("hidden_signals")
    .select("signal_id")
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((item) => item.signal_id).filter(Boolean);
}

export async function hideSignal(signalId: string) {
  if (typeof window === "undefined") return;

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("hidden_signals").upsert({
    signal_id: signalId,
    hidden_by: user.id,
  });

  window.dispatchEvent(new Event("traderadar-hidden-signals-changed"));
}

export async function showSignal(signalId: string) {
  if (typeof window === "undefined") return;

  const supabase = createClient();

  await supabase.from("hidden_signals").delete().eq("signal_id", signalId);

  window.dispatchEvent(new Event("traderadar-hidden-signals-changed"));
}

export async function isSignalHidden(signalId: string) {
  const hiddenIds = await getHiddenSignalIds();

  return hiddenIds.includes(signalId);
}

export async function filterVisibleSignals(signals: TradeSignal[]) {
  const hiddenIds = await getHiddenSignalIds();

  return signals.filter((signal) => !hiddenIds.includes(signal.id));
}