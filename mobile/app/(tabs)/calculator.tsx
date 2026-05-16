import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import AppHeader from "@/components/AppHeader";

function fmt(v: number, dp = 2) {
  return v.toLocaleString("en-ZA", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

const RISK_PRESETS = [0.5, 1, 1.5, 2];

export default function CalculatorScreen() {
  const [balance, setBalance] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const bal = parseFloat(balance) || 0;
  const risk = parseFloat(riskPct) || 0;
  const entryPrice = parseFloat(entry) || 0;
  const slPrice = parseFloat(stopLoss) || 0;

  const riskAmount = (bal * risk) / 100;
  const stopDistance = Math.abs(entryPrice - slPrice);
  const stopPct = entryPrice > 0 && stopDistance > 0 ? (stopDistance / entryPrice) * 100 : 0;

  // Units = riskAmount / stopDistance (price terms)
  // For a simplified lot estimate (forex): 1 standard lot = 100,000 units
  const units = stopDistance > 0 ? riskAmount / stopDistance : 0;
  const forexLots = units / 100000;

  const rr1 = entryPrice > 0 && stopDistance > 0
    ? Math.abs(entryPrice * 0.008 - entryPrice) / stopDistance
    : null; // TP1 at 0.8% move

  const hasValidInputs = bal > 0 && risk > 0 && entryPrice > 0 && slPrice > 0 && stopDistance > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader title="Lot Calculator" subtitle="Risk management · size your trades" />
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Account Balance (R)</Text>
          <TextInput
            style={styles.input}
            value={balance}
            onChangeText={setBalance}
            keyboardType="decimal-pad"
            placeholder="e.g. 10000"
            placeholderTextColor={colors.dim}
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Risk Per Trade</Text>
          <View style={styles.presetRow}>
            {RISK_PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.preset, riskPct === String(p) && styles.presetActive]}
                onPress={() => setRiskPct(String(p))}
              >
                <Text style={[styles.presetText, riskPct === String(p) && styles.presetTextActive]}>
                  {p}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={riskPct}
            onChangeText={setRiskPct}
            keyboardType="decimal-pad"
            placeholder="e.g. 1"
            placeholderTextColor={colors.dim}
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Entry Price</Text>
          <TextInput
            style={styles.input}
            value={entry}
            onChangeText={setEntry}
            keyboardType="decimal-pad"
            placeholder="e.g. 2380.50"
            placeholderTextColor={colors.dim}
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Stop Loss Price</Text>
          <TextInput
            style={styles.input}
            value={stopLoss}
            onChangeText={setStopLoss}
            keyboardType="decimal-pad"
            placeholder="e.g. 2370.00"
            placeholderTextColor={colors.dim}
          />
        </View>

        {hasValidInputs ? (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Results</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Risk Amount</Text>
              <Text style={styles.resultValue}>R {fmt(riskAmount)}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Stop Distance</Text>
              <Text style={styles.resultValue}>{fmt(stopDistance, 5)} ({fmt(stopPct)}%)</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Position Size (units)</Text>
              <Text style={styles.resultValue}>{fmt(units, 2)}</Text>
            </View>

            <View style={[styles.resultRow, styles.resultRowHighlight]}>
              <Text style={styles.resultLabelHighlight}>Forex Lots (estimate)</Text>
              <Text style={styles.resultValueHighlight}>{forexLots.toFixed(4)}</Text>
            </View>

            {rr1 !== null && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>R:R at TP1 (0.8%)</Text>
                <Text style={[styles.resultValue, { color: rr1 >= 1 ? colors.emerald : colors.yellow }]}>
                  1 : {fmt(rr1)}
                </Text>
              </View>
            )}

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                Lot sizes are approximate. Verify on Exness before entering — pip value varies by asset, account currency, and leverage.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyResult}>
            <Text style={styles.emptyResultText}>Fill in all fields to see your position size.</Text>
          </View>
        )}

        <View style={styles.ruleCard}>
          <Text style={styles.ruleTitle}>Risk Rule</Text>
          <Text style={styles.ruleText}>
            Never risk more than <Text style={{ color: colors.text, fontWeight: "700" }}>1–2%</Text> of your account on a single trade. After TP1 is hit, move your stop to entry (breakeven).
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: {
    margin: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
  },
  presetRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  preset: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bg,
  },
  presetActive: { borderColor: colors.emerald, backgroundColor: colors.emeraldBg },
  presetText: { fontSize: 13, fontWeight: "600", color: colors.subtext },
  presetTextActive: { color: colors.emerald },
  resultsCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.emeraldBorder,
    padding: 20,
  },
  resultsTitle: { fontSize: 13, fontWeight: "700", color: colors.emerald, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16 },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultRowHighlight: {
    backgroundColor: colors.emeraldBg,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginTop: 4,
    marginBottom: 4,
  },
  resultLabel: { fontSize: 13, color: colors.subtext },
  resultValue: { fontSize: 14, fontWeight: "700", color: colors.text },
  resultLabelHighlight: { fontSize: 13, color: colors.emeraldLight, fontWeight: "600" },
  resultValueHighlight: { fontSize: 18, fontWeight: "900", color: colors.emeraldLight },
  disclaimer: {
    marginTop: 12,
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 12,
  },
  disclaimerText: { fontSize: 12, color: colors.dim, lineHeight: 18 },
  emptyResult: { margin: 16, marginTop: 0, padding: 20, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  emptyResultText: { fontSize: 14, color: colors.subtext, textAlign: "center" },
  ruleCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: colors.blueBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.blueBorder,
    padding: 16,
  },
  ruleTitle: { fontSize: 11, fontWeight: "700", color: colors.blue, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  ruleText: { fontSize: 13, color: colors.subtext, lineHeight: 20 },
});
