import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import type { SignalResult } from "@/lib/types";
import { colors } from "@/constants/colors";

type Stats = {
  total: number;
  waiting: number;
  open: number;
  tpHits: number;
  slHits: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  streakCount: number;
  streakType: "win" | "loss" | null;
};

function computeStats(results: SignalResult[]): Stats {
  const total = results.length;
  const waiting = results.filter((r) => r.status === "waiting").length;
  const open = results.filter((r) => r.status === "open").length;
  const tpHits = results.filter((r) => ["tp1_hit", "tp2_hit", "tp3_hit"].includes(r.status)).length;
  const slHits = results.filter((r) => r.status === "sl_hit").length;
  const completed = tpHits + slHits;
  const winRate = completed === 0 ? 0 : Math.round((tpHits / completed) * 100);

  const closed = results.filter((r) =>
    ["tp1_hit", "tp2_hit", "tp3_hit", "sl_hit"].includes(r.status)
  );
  const pnlValues = closed
    .map((r) => r.pnl_percent)
    .filter((v): v is number => typeof v === "number");
  const totalPnl = pnlValues.reduce((s, v) => s + v, 0);
  const avgPnl = pnlValues.length === 0 ? 0 : totalPnl / pnlValues.length;

  // streak (API returns newest-first)
  let streakCount = 0;
  let streakType: "win" | "loss" | null = null;
  for (const r of closed) {
    const isWin = ["tp1_hit", "tp2_hit", "tp3_hit"].includes(r.status);
    const thisType = isWin ? "win" : "loss";
    if (streakType === null) {
      streakType = thisType;
      streakCount = 1;
    } else if (thisType === streakType) {
      streakCount++;
    } else {
      break;
    }
  }

  return { total, waiting, open, tpHits, slHits, winRate, totalPnl, avgPnl, streakCount, streakType };
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function fmt(v: number | null | undefined, decimals = 2, suffix = "%") {
  if (typeof v !== "number") return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(decimals)}${suffix}`;
}

export default function PerformanceScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentClosed, setRecentClosed] = useState<SignalResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("signal_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    const results = (data || []) as SignalResult[];
    setStats(computeStats(results));
    setRecentClosed(
      results
        .filter((r) => ["tp1_hit", "tp2_hit", "tp3_hit", "sl_hit"].includes(r.status))
        .slice(0, 20)
    );
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => { load(); }, [load]);

  const streakColor =
    stats?.streakType === "win" ? colors.emerald
    : stats?.streakType === "loss" ? colors.red
    : colors.subtext;

  const streakLabel =
    stats?.streakCount
      ? `${stats.streakCount}${stats.streakType === "win" ? "W" : "L"}`
      : "—";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Signal Performance</Text>
          <Text style={styles.title}>Proof Engine</Text>
          <Text style={styles.sub}>Closed trades only. Open and waiting signals don't count as wins or losses.</Text>
        </View>

        {stats && (
          <View style={styles.grid}>
            <StatCard label="Total" value={String(stats.total)} />
            <StatCard label="Waiting" value={String(stats.waiting)} />
            <StatCard label="Open" value={String(stats.open)} />
            <StatCard label="TP Hits" value={String(stats.tpHits)} color={colors.emerald} />
            <StatCard label="SL Hits" value={String(stats.slHits)} color={colors.red} />
            <StatCard
              label="Win Rate"
              value={`${stats.winRate}%`}
              color={stats.winRate >= 50 ? colors.emerald : colors.yellow}
            />
            <StatCard
              label="Total PnL"
              value={fmt(stats.totalPnl)}
              color={stats.totalPnl >= 0 ? colors.emerald : colors.red}
            />
            <StatCard
              label="Avg PnL"
              value={fmt(stats.avgPnl)}
              color={stats.avgPnl >= 0 ? colors.emerald : colors.red}
            />
            <StatCard label="Streak" value={streakLabel} color={streakColor} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Closed Trades</Text>
        </View>

        {recentClosed.length === 0 ? (
          <Text style={styles.emptyText}>No closed trades yet.</Text>
        ) : (
          recentClosed.map((r) => {
            const isWin = ["tp1_hit", "tp2_hit", "tp3_hit"].includes(r.status);
            const isSl = r.status === "sl_hit";
            const pnlColor = isWin ? colors.emerald : isSl ? colors.red : colors.subtext;
            const statusLabel =
              r.status === "tp1_hit" ? "TP1" :
              r.status === "tp2_hit" ? "TP2" :
              r.status === "tp3_hit" ? "TP3" :
              r.status === "sl_hit"  ? "SL"  : "EXPIRED";

            return (
              <View key={r.id} style={styles.tradeRow}>
                <View style={styles.tradeLeft}>
                  <Text style={styles.tradeAsset}>{r.asset}</Text>
                  <Text style={[styles.tradeDir, r.direction === "BUY" ? { color: colors.emerald } : { color: colors.red }]}>
                    {r.direction}
                  </Text>
                </View>
                <View style={styles.tradeRight}>
                  <View style={[styles.statusBadge, { borderColor: isWin ? colors.emeraldBorder : isSl ? colors.redBorder : colors.border, backgroundColor: isWin ? colors.emeraldBg : isSl ? colors.redBg : colors.card }]}>
                    <Text style={[styles.statusText, { color: isWin ? colors.emerald : isSl ? colors.red : colors.subtext }]}>{statusLabel}</Text>
                  </View>
                  <Text style={[styles.tradePnl, { color: pnlColor }]}>
                    {fmt(r.pnl_percent)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 20, paddingBottom: 8 },
  eyebrow: { fontSize: 11, fontWeight: "700", color: colors.emerald, textTransform: "uppercase", letterSpacing: 1.2 },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 4 },
  sub: { fontSize: 13, color: colors.subtext, marginTop: 6, lineHeight: 20 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
  },
  statCard: {
    width: "30%",
    flexGrow: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  statLabel: { fontSize: 10, fontWeight: "600", color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.8 },
  statValue: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 6 },
  section: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.8 },
  emptyText: { padding: 20, color: colors.subtext, fontSize: 14 },
  tradeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tradeLeft: { gap: 4 },
  tradeAsset: { fontSize: 16, fontWeight: "700", color: colors.text },
  tradeDir: { fontSize: 12, fontWeight: "600" },
  tradeRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },
  tradePnl: { fontSize: 15, fontWeight: "700", minWidth: 60, textAlign: "right" },
});
