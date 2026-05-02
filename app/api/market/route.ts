import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTopMovers, getTopMoverSignals } from "@/lib/topMovers";
import { updateSignalStatuses } from "@/lib/signals";
import { getCurrentSession } from "@/lib/session";
import {
  calculateFinalScore,
  findMoverForSignal,
  getScoreThreshold,
  isCryptoAsset,
  isQualitySignal,
  normalizeAsset,
  type Mover,
  type RankedSignal,
  type TradeSignalForDb,
} from "@/lib/strategy";

type ExistingSignal = {
  asset: string;
  status: string;
  created_at: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_NEW_SIGNALS = 5;
const ASSET_COOLDOWN_MINUTES = 45;

async function getRecentActiveSignals() {
  const since = new Date(
    Date.now() - ASSET_COOLDOWN_MINUTES * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("signal_results")
    .select("asset, status, created_at")
    .gte("created_at", since)
    .in("status", ["waiting", "open"]);

  if (error) {
    console.error("RECENT SIGNAL FETCH ERROR:", error);
    return [];
  }

  return (data || []) as ExistingSignal[];
}

function isAssetOnCooldown(
  signal: TradeSignalForDb,
  recentSignals: ExistingSignal[]
) {
  const asset = normalizeAsset(signal.primaryAsset);

  return recentSignals.some(
    (existing) => normalizeAsset(existing.asset) === asset
  );
}

export async function GET() {
  try {
    console.log("STEP 1: start");

    const session = getCurrentSession();

    const movers = (await getTopMovers(10)) as Mover[];
    console.log("STEP 2: movers", movers.length);
    console.log("STEP 3: session", session);

    const rawSignals = (await getTopMoverSignals(10)) as TradeSignalForDb[];
    console.log("STEP 4: raw signals", rawSignals.length);

    const recentSignals = await getRecentActiveSignals();
    console.log("STEP 5: recent active signals", recentSignals.length);

    const rankedSignals = rawSignals
      .map((signal) => {
        const mover = findMoverForSignal(signal, movers);
        const ranking = calculateFinalScore(signal, mover);

        return {
          ...signal,
          finalScore: Number(ranking.finalScore.toFixed(2)),
          rankingReasons: ranking.rankingReasons,
        } as RankedSignal;
      })
      .filter((signal) => {
        const mover = findMoverForSignal(signal, movers);
        const scoreThreshold = getScoreThreshold(signal.primaryAsset);

        if (!isQualitySignal(signal, mover, scoreThreshold)) return false;
        if (isAssetOnCooldown(signal, recentSignals)) return false;

        return true;
      })
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, MAX_NEW_SIGNALS);

    console.log("STEP 6: ranked quality signals", rankedSignals.length);

    const rows = rankedSignals.flatMap((signal) => {
      const plan = signal.tradePlan;

      if (!plan) return [];

      return [
        {
          asset: signal.primaryAsset || "UNKNOWN",
          direction: plan.direction,
          entry_price: plan.entryPrice,
          entry_zone_low: plan.entryZoneLow ?? plan.entryPrice,
          entry_zone_high: plan.entryZoneHigh ?? plan.entryPrice,
          stop_loss: plan.stopLoss,
          tp1: plan.takeProfits?.[0]?.price ?? null,
          tp2: plan.takeProfits?.[1]?.price ?? null,
          tp3: plan.takeProfits?.[2]?.price ?? null,
          status: "waiting",
          result_label: "WAITING",
          pnl_percent: 0,
          asset_class: isCryptoAsset(signal.primaryAsset)
            ? "crypto"
            : "standard",
        },
      ];
    });

    console.log("STEP 7: rows", rows.length);

    if (rows.length > 0) {
      const { error } = await supabase.from("signal_results").upsert(rows, {
        onConflict: "asset,direction,entry_price,stop_loss",
      });

      if (error) {
        console.error("UPSERT ERROR:", error);
      } else {
        console.log("STEP 8: upsert success");
      }
    }

    console.log("STEP 9: updating statuses...");
    await updateSignalStatuses(movers);

    console.log("STEP 10: DONE");

    return NextResponse.json({
      ok: true,
      session,
      maxNewSignals: MAX_NEW_SIGNALS,
      assetCooldownMinutes: ASSET_COOLDOWN_MINUTES,
      recentActiveSignals: recentSignals.length,
      movers,
      signals: rankedSignals,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("MARKET API ERROR:", error);

    return NextResponse.json({ error: "Market API failed" }, { status: 500 });
  }
}