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
  if (["tp1_hit", "tp2_hit", "tp3_hit"].includes(status)) {
    return { border: colors.emeraldBorder, bg: colors.emeraldBg, text: colors.emerald };
  }
  if (status === "sl_hit") return { border: colors.redBorder, bg: colors.redBg, text: colors.red };
  if (status === "open") return { border: colors.blueBorder, bg: colors.blueBg, text: colors.blue };
  if (status === "waiting") return { border: colors.yellowBorder, bg: colors.yellowBg, text: colors.yellow };
  return { border: colors.border, bg: colors.card, text: colors.subtext };
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    waiting: "PENDING ENTRY",
    open: "LIVE",
    tp1_hit: "TP1 HIT",
    tp2_hit: "TP2 HIT",
    tp3_hit: "TP3 HIT",
    sl_hit: "STOPPED OUT",
    expired: "EXPIRED",
  };
  return map[status] ?? status.toUpperCase();
}

export default function SignalCard({ result }: { result: SignalResult }) {
  const st = getStatusStyle(result.status);
  const isBuy = result.direction === "BUY";
  const accentColor = isBuy ? colors.emerald : colors.red;

  const pnlColor =
    typeof result.pnl_percent === "number"
      ? result.pnl_percent > 0 ? colors.emerald
      : result.pnl_percent < 0 ? colors.red
      : colors.subtext
      : colors.subtext;

  const tp1Hit = ["tp1_hit", "tp2_hit", "tp3_hit"].includes(result.status);
  const tp2Hit = ["tp2_hit", "tp3_hit"].includes(result.status);
  const tp3Hit = result.status === "tp3_hit";
  const slHit = result.status === "sl_hit";

  return (
    <View style={styles.card}>
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.assetGroup}>
            <Text style={styles.asset}>{result.asset}</Text>
            <View style={[styles.dirBadge, {
              borderColor: isBuy ? colors.emeraldBorder : colors.redBorder,
              backgroundColor: isBuy ? colors.emeraldBg : colors.redBg,
            }]}>
              <Text style={[styles.dirText, { color: accentColor }]}>{result.direction}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { borderColor: st.border, backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.text }]}>{getStatusLabel(result.status)}</Text>
          </View>
        </View>

        {/* Price grid */}
        <View style={styles.grid}>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>Entry Zone</Text>
            <Text style={styles.cellValue} numberOfLines={1}>
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
            <Text style={[styles.cellValue, { color: pnlColor, fontSize: 15, fontWeight: "800" }]}>
              {fmtPnl(result.pnl_percent)}
            </Text>
          </View>
        </View>

        {/* Progress pills */}
        <View style={styles.progressRow}>
          {(["TP1", "TP2", "TP3"] as const).map((label, i) => {
            const hit = i === 0 ? tp1Hit : i === 1 ? tp2Hit : tp3Hit;
            return (
              <View
                key={label}
                style={[
                  styles.pill,
                  hit
                    ? { borderColor: colors.emeraldBorder, backgroundColor: colors.emeraldBg }
                    : { borderColor: colors.border, backgroundColor: colors.bg },
                ]}
              >
                <Text style={[styles.pillText, { color: hit ? colors.emerald : colors.dim }]}>{label}</Text>
              </View>
            );
          })}
          <View
            style={[
              styles.pill,
              slHit
                ? { borderColor: colors.redBorder, backgroundColor: colors.redBg }
                : { borderColor: colors.border, backgroundColor: colors.bg },
            ]}
          >
            <Text style={[styles.pillText, { color: slHit ? colors.red : colors.dim }]}>SL</Text>
          </View>
        </View>

        {/* Extra targets */}
        {result.tp2 && (
          <View style={styles.extraTargets}>
            <Text style={styles.targetItem}>
              TP2 <Text style={styles.targetPrice}>{fmt(result.tp2)}</Text>
            </Text>
            {result.tp3 && (
              <Text style={styles.targetItem}>
                TP3 <Text style={styles.targetPrice}>{fmt(result.tp3)}</Text>
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  accent: {
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assetGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  asset: { fontSize: 20, fontWeight: "900", color: colors.text, letterSpacing: -0.5 },
  dirBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dirText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 9,
  },
  cellLabel: {
    fontSize: 9,
    color: colors.dim,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
    fontWeight: "700",
  },
  cellValue: { fontSize: 13, fontWeight: "700", color: colors.text },
  progressRow: { flexDirection: "row", gap: 5 },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 7,
    paddingVertical: 5,
    alignItems: "center",
  },
  pillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  extraTargets: { flexDirection: "row", gap: 14 },
  targetItem: { fontSize: 11, color: colors.dim },
  targetPrice: { color: colors.emerald, fontWeight: "700" },
});
