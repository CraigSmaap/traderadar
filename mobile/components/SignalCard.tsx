import { View, Text, StyleSheet } from "react-native";
import type { SignalResult } from "@/lib/types";
import { colors } from "@/constants/colors";

function fmt(v?: number | null) {
  if (typeof v !== "number") return "—";
  return v.toLocaleString("en-US", { maximumFractionDigits: v > 100 ? 2 : 5 });
}

function fmtPnl(v?: number | null) {
  if (typeof v !== "number") return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function getStatusStyle(status: string) {
  if (status === "tp1_hit" || status === "tp2_hit" || status === "tp3_hit") {
    return { border: colors.emeraldBorder, bg: colors.emeraldBg, text: colors.emerald };
  }
  if (status === "sl_hit") {
    return { border: colors.redBorder, bg: colors.redBg, text: colors.red };
  }
  if (status === "open") {
    return { border: colors.blueBorder, bg: colors.blueBg, text: colors.blue };
  }
  if (status === "waiting") {
    return { border: colors.yellowBorder, bg: colors.yellowBg, text: colors.yellow };
  }
  return { border: colors.border, bg: colors.card, text: colors.subtext };
}

function getStatusLabel(status: string) {
  if (status === "waiting") return "WAITING ENTRY";
  if (status === "open") return "OPEN";
  if (status === "tp1_hit") return "TP1 HIT ✓";
  if (status === "tp2_hit") return "TP2 HIT ✓";
  if (status === "tp3_hit") return "TP3 HIT ✓";
  if (status === "sl_hit") return "SL HIT";
  if (status === "expired") return "EXPIRED";
  return status.toUpperCase();
}

export default function SignalCard({ result }: { result: SignalResult }) {
  const statusStyle = getStatusStyle(result.status);
  const isBuy = result.direction === "BUY";
  const pnlColor =
    typeof result.pnl_percent === "number"
      ? result.pnl_percent > 0 ? colors.emerald : result.pnl_percent < 0 ? colors.red : colors.subtext
      : colors.subtext;

  const tp1Active = ["tp1_hit", "tp2_hit", "tp3_hit"].includes(result.status);
  const tp2Active = ["tp2_hit", "tp3_hit"].includes(result.status);
  const tp3Active = result.status === "tp3_hit";
  const slHit = result.status === "sl_hit";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.assetRow}>
          <Text style={styles.asset}>{result.asset}</Text>
          <View style={[styles.dirBadge, { borderColor: isBuy ? colors.emeraldBorder : colors.redBorder, backgroundColor: isBuy ? colors.emeraldBg : colors.redBg }]}>
            <Text style={[styles.dirText, { color: isBuy ? colors.emerald : colors.red }]}>
              {result.direction}
            </Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { borderColor: statusStyle.border, backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {getStatusLabel(result.status)}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Entry Zone</Text>
          <Text style={styles.cellValue}>
            {fmt(result.entry_zone_low ?? result.entry_price)} – {fmt(result.entry_zone_high ?? result.entry_price)}
          </Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Stop Loss</Text>
          <Text style={[styles.cellValue, { color: colors.red }]}>{fmt(result.stop_loss)}</Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.cellLabel}>TP1</Text>
          <Text style={[styles.cellValue, { color: colors.emerald }]}>{fmt(result.tp1)}</Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Running PnL</Text>
          <Text style={[styles.cellValue, { color: pnlColor }]}>{fmtPnl(result.pnl_percent)}</Text>
        </View>
      </View>

      {/* TP / SL progress pills */}
      <View style={styles.progressRow}>
        {(["TP1", "TP2", "TP3"] as const).map((label, i) => {
          const hit = i === 0 ? tp1Active : i === 1 ? tp2Active : tp3Active;
          return (
            <View key={label} style={[styles.pill, hit ? { borderColor: colors.emeraldBorder, backgroundColor: colors.emeraldBg } : { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.pillText, { color: hit ? colors.emerald : colors.dim }]}>{label}</Text>
            </View>
          );
        })}
        <View style={[styles.pill, slHit ? { borderColor: colors.redBorder, backgroundColor: colors.redBg } : { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.pillText, { color: slHit ? colors.red : colors.dim }]}>SL</Text>
        </View>
      </View>

      {result.tp2 && (
        <View style={styles.extraTargets}>
          <Text style={styles.targetText}>TP2 <Text style={styles.targetPrice}>{fmt(result.tp2)}</Text></Text>
          {result.tp3 && <Text style={styles.targetText}>TP3 <Text style={styles.targetPrice}>{fmt(result.tp3)}</Text></Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  assetRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  asset: { fontSize: 20, fontWeight: "900", color: colors.text },
  dirBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dirText: { fontSize: 12, fontWeight: "800" },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  cellLabel: { fontSize: 10, color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  cellValue: { fontSize: 13, fontWeight: "700", color: colors.text },
  progressRow: { flexDirection: "row", gap: 6 },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  pillText: { fontSize: 11, fontWeight: "700" },
  extraTargets: { flexDirection: "row", gap: 16 },
  targetText: { fontSize: 12, color: colors.subtext },
  targetPrice: { color: colors.emerald, fontWeight: "600" },
});
