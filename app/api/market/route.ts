import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTopMovers, getTopMoverSignals } from "@/lib/topMovers";
import { updateSignalStatuses } from "@/lib/signals";
import { getCurrentSession } from "@/lib/session";
import { isExnessAllowedAsset } from "@/lib/types";
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
import { sendTelegramSignal } from "@/lib/telegram";
import { sendPushNotification, type PushSubscriptionRecord } from "@/lib/webpush";

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

async function getActiveSignals() {
  const { data, error } = await supabase
    .from("signal_results")
    .select("asset, status, created_at")
    .in("status", ["waiting", "open"]);

  if (error) {
    console.error("ACTIVE SIGNAL FETCH ERROR:", error);
    return [];
  }

  return (data || []) as ExistingSignal[];
}

function isAssetAlreadyActive(
  signal: TradeSignalForDb,
  activeSignals: ExistingSignal[]
) {
  const asset = normalizeAsset(signal.primaryAsset);

  return activeSignals.some(
    (existing) => normalizeAsset(existing.asset) === asset
  );
}

function getCleanAsset(value: string | undefined | null) {
  if (!value) return null;

  const normalized = normalizeAsset(value);

  if (!isExnessAllowedAsset(normalized)) {
    return null;
  }

  return normalized;
}

export async function GET() {
  try {
    console.log("STEP 1: start");

    const session = getCurrentSession();

    const movers = ((await getTopMovers(10)) as Mover[]).filter((mover) => {
      const cleanAsset = getCleanAsset(mover.symbol);
      return cleanAsset !== null;
    });

    console.log("STEP 2: movers", movers.length);
    console.log("STEP 3: session", session);

    console.log("STEP 4: updating statuses before ranking...");
    await updateSignalStatuses(movers);

    const rawSignals = (
      (await getTopMoverSignals(10)) as TradeSignalForDb[]
    ).filter((signal) => {
      const cleanAsset = getCleanAsset(signal.primaryAsset);
      return cleanAsset !== null;
    });

    console.log("STEP 5: raw signals", rawSignals.length);

    // 🔥 DEBUG BLOCK (THIS IS WHAT WE ADDED)
    console.log(
      "DEBUG SCORES:",
      rawSignals.map((signal) => {
        const mover = findMoverForSignal(signal, movers);
        const ranking = calculateFinalScore(signal, mover);

        return {
          asset: signal.primaryAsset,
          baseRadar: signal.radarScore,
          moverRadar: mover?.radarScore,
          finalScore: Number(ranking.finalScore.toFixed(2)),
          reasons: ranking.rankingReasons,
        };
      })
    );

    const activeSignals = await getActiveSignals();
    console.log("STEP 6: active waiting/open signals", activeSignals.length);

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
        const cleanAsset = getCleanAsset(signal.primaryAsset);
        if (!cleanAsset) return false;

        const mover = findMoverForSignal(signal, movers);
        const scoreThreshold = getScoreThreshold(signal.primaryAsset);

        if (!isQualitySignal(signal, mover, scoreThreshold)) return false;
        if (isAssetAlreadyActive(signal, activeSignals)) return false;

        return true;
      })
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, MAX_NEW_SIGNALS);

    console.log("STEP 7: ranked quality new signals", rankedSignals.length);

    const rows = rankedSignals.flatMap((signal) => {
      const plan = signal.tradePlan;
      const cleanAsset = getCleanAsset(signal.primaryAsset);

      if (!plan || !cleanAsset) return [];

      return [
        {
          asset: cleanAsset,
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
          asset_class: isCryptoAsset(cleanAsset) ? "crypto" : "standard",
        },
      ];
    });

    console.log("STEP 8: rows", rows.length);

    if (rows.length > 0) {
      const { error } = await supabase.from("signal_results").upsert(rows, {
        onConflict: "asset,direction,entry_price,stop_loss",
      });

      if (error) {
        console.error("UPSERT ERROR:", error);
      } else {
        console.log("STEP 9: upsert success");

        // Fire Telegram + push notifications (non-blocking)
        const { data: pushSubs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth");

        const subs = (pushSubs || []) as PushSubscriptionRecord[];

        for (const row of rows) {
          void sendTelegramSignal(row as Parameters<typeof sendTelegramSignal>[0]);

          const pushPayload = {
            title: `${row.direction} ${row.asset}`,
            body: `Entry ${row.entry_zone_low ?? row.entry_price} · SL ${row.stop_loss} · TP1 ${row.tp1 ?? "—"}`,
            url: "/live",
            tag: `signal-${row.asset}`,
          };

          for (const sub of subs) {
            void sendPushNotification(sub, pushPayload);
          }
        }
      }
    }

    console.log("STEP 10: DONE");

    return NextResponse.json({
      ok: true,
      session,
      maxNewSignals: MAX_NEW_SIGNALS,
      activeSignals: activeSignals.length,
      movers,
      signals: rankedSignals,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("MARKET API ERROR:", error);

    return NextResponse.json({ error: "Market API failed" }, { status: 500 });
  }
}