import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import type { JournalEntry } from "@/lib/types";
import { ASSETS } from "@/lib/types";
import { colors } from "@/constants/colors";
import AppHeader from "@/components/AppHeader";

function fmt(v?: number | null, dp = 5) {
  if (typeof v !== "number") return "—";
  return v.toLocaleString("en-US", { maximumFractionDigits: dp });
}

function fmtPnl(v?: number | null) {
  if (typeof v !== "number") return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

const EMOTIONS = ["Calm", "Confident", "Anxious", "Greedy", "Fearful", "Disciplined"];

type FormState = {
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: string;
  exit_price: string;
  lot_size: string;
  pnl_amount: string;
  emotion: string;
  notes: string;
  status: "open" | "closed";
};

const defaultForm: FormState = {
  asset: "XAUUSD",
  direction: "BUY",
  entry_price: "",
  exit_price: "",
  lot_size: "",
  pnl_amount: "",
  emotion: "",
  notes: "",
  status: "open",
};

function AddTradeModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");

  const filteredAssets = assetSearch
    ? ASSETS.filter((a) => a.includes(assetSearch.toUpperCase()))
    : ASSETS;

  async function save() {
    if (!form.asset || !form.entry_price) {
      Alert.alert("Error", "Asset and entry price are required.");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const entry: Partial<JournalEntry> = {
        user_id: user?.id,
        asset: form.asset,
        direction: form.direction,
        entry_price: parseFloat(form.entry_price),
        exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
        lot_size: form.lot_size ? parseFloat(form.lot_size) : null,
        pnl_amount: form.pnl_amount ? parseFloat(form.pnl_amount) : null,
        pnl_percent: null,
        emotion: form.emotion || null,
        notes: form.notes || null,
        status: form.status,
        opened_at: new Date().toISOString(),
        closed_at: form.status === "closed" ? new Date().toISOString() : null,
      };

      // Compute pnl_percent if we have entry + exit
      if (entry.exit_price && entry.entry_price) {
        const diff = form.direction === "BUY"
          ? entry.exit_price - entry.entry_price
          : entry.entry_price - entry.exit_price;
        entry.pnl_percent = (diff / entry.entry_price) * 100;
      }

      const { error } = await supabase.from("journal_entries").insert(entry);

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        setForm(defaultForm);
        setAssetSearch("");
        onSaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={modal.header}>
            <Text style={modal.title}>Log Trade</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={modal.close}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={modal.body} keyboardShouldPersistTaps="handled">
            <Text style={modal.label}>Asset</Text>
            <TextInput
              style={modal.input}
              value={assetSearch}
              onChangeText={setAssetSearch}
              placeholder="Search assets..."
              placeholderTextColor={colors.dim}
              autoCapitalize="characters"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {filteredAssets.slice(0, 12).map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[modal.chip, form.asset === a && modal.chipActive]}
                  onPress={() => { setForm((f) => ({ ...f, asset: a })); setAssetSearch(""); }}
                >
                  <Text style={[modal.chipText, form.asset === a && modal.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={modal.label}>Direction</Text>
            <View style={modal.row}>
              {(["BUY", "SELL"] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[modal.dirBtn, form.direction === d && (d === "BUY" ? modal.dirBuyActive : modal.dirSellActive)]}
                  onPress={() => setForm((f) => ({ ...f, direction: d }))}
                >
                  <Text style={[modal.dirText, form.direction === d && { color: d === "BUY" ? colors.emerald : colors.red }]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={modal.label}>Entry Price</Text>
            <TextInput style={modal.input} value={form.entry_price} onChangeText={(v) => setForm((f) => ({ ...f, entry_price: v }))} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.dim} />

            <Text style={[modal.label, { marginTop: 12 }]}>Exit Price (optional)</Text>
            <TextInput style={modal.input} value={form.exit_price} onChangeText={(v) => setForm((f) => ({ ...f, exit_price: v }))} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.dim} />

            <Text style={[modal.label, { marginTop: 12 }]}>Lot Size (optional)</Text>
            <TextInput style={modal.input} value={form.lot_size} onChangeText={(v) => setForm((f) => ({ ...f, lot_size: v }))} keyboardType="decimal-pad" placeholder="0.01" placeholderTextColor={colors.dim} />

            <Text style={[modal.label, { marginTop: 12 }]}>Status</Text>
            <View style={modal.row}>
              {(["open", "closed"] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[modal.chip, form.status === s && modal.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, status: s }))}
                >
                  <Text style={[modal.chipText, form.status === s && modal.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[modal.label, { marginTop: 12 }]}>Emotion</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {EMOTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[modal.chip, form.emotion === e && modal.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, emotion: e }))}
                >
                  <Text style={[modal.chipText, form.emotion === e && modal.chipTextActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[modal.label, { marginTop: 12 }]}>Notes (optional)</Text>
            <TextInput
              style={[modal.input, { height: 80, textAlignVertical: "top" }]}
              value={form.notes}
              onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
              multiline
              placeholder="What did you observe?"
              placeholderTextColor={colors.dim}
            />

            <TouchableOpacity
              style={[modal.saveBtn, saving && { opacity: 0.6 }]}
              onPress={save}
              disabled={saving}
            >
              <Text style={modal.saveBtnText}>{saving ? "Saving..." : "Save Trade"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("opened_at", { ascending: false })
      .limit(50);

    setEntries((data || []) as JournalEntry[]);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => { load(); }, [load]);

  const totalPnl = entries
    .filter((e) => e.status === "closed" && typeof e.pnl_percent === "number")
    .reduce((s, e) => s + (e.pnl_percent ?? 0), 0);

  const wins = entries.filter((e) => e.status === "closed" && (e.pnl_percent ?? 0) > 0).length;
  const closed = entries.filter((e) => e.status === "closed").length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader
        title="Trade Journal"
        subtitle={`${entries.length} trades logged`}
        right={
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color="#000" />
          </TouchableOpacity>
        }
      />

      {entries.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Win Rate</Text>
            <Text style={styles.summaryValue}>{closed === 0 ? "—" : `${Math.round((wins / closed) * 100)}%`}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total PnL</Text>
            <Text style={[styles.summaryValue, { color: totalPnl >= 0 ? colors.emerald : colors.red }]}>
              {fmtPnl(totalPnl)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Closed</Text>
            <Text style={styles.summaryValue}>{closed}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : { paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No trades logged yet</Text>
            <Text style={styles.emptySub}>Tap + Add to log your first trade.</Text>
          </View>
        }
        renderItem={({ item: e }) => {
          const isWin = (e.pnl_percent ?? 0) > 0;
          const isOpen = e.status === "open";
          return (
            <View style={styles.entryRow}>
              <View style={styles.entryLeft}>
                <Text style={styles.entryAsset}>{e.asset}</Text>
                <Text style={[styles.entryDir, e.direction === "BUY" ? { color: colors.emerald } : { color: colors.red }]}>
                  {e.direction}
                </Text>
                <Text style={styles.entryPrice}>Entry: {fmt(e.entry_price)}</Text>
                {e.emotion && <Text style={styles.entryEmotion}>{e.emotion}</Text>}
              </View>
              <View style={styles.entryRight}>
                <View style={[styles.statusBadge, isOpen ? { borderColor: colors.yellowBorder, backgroundColor: colors.yellowBg } : isWin ? { borderColor: colors.emeraldBorder, backgroundColor: colors.emeraldBg } : { borderColor: colors.redBorder, backgroundColor: colors.redBg }]}>
                  <Text style={[styles.statusText, isOpen ? { color: colors.yellow } : isWin ? { color: colors.emerald } : { color: colors.red }]}>
                    {isOpen ? "OPEN" : isWin ? "WIN" : "LOSS"}
                  </Text>
                </View>
                {typeof e.pnl_percent === "number" && (
                  <Text style={[styles.entryPnl, { color: isWin ? colors.emerald : colors.red }]}>
                    {fmtPnl(e.pnl_percent)}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />

      <AddTradeModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSaved={load}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.emerald,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRow: { flexDirection: "row", padding: 12, gap: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: "center",
  },
  summaryLabel: { fontSize: 10, color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.6 },
  summaryValue: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 4 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, marginTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.subtext, textAlign: "center" },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryLeft: { gap: 3 },
  entryAsset: { fontSize: 16, fontWeight: "700", color: colors.text },
  entryDir: { fontSize: 12, fontWeight: "600" },
  entryPrice: { fontSize: 12, color: colors.subtext },
  entryEmotion: { fontSize: 11, color: colors.dim, fontStyle: "italic" },
  entryRight: { alignItems: "flex-end", gap: 6 },
  statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },
  entryPnl: { fontSize: 15, fontWeight: "700" },
});

const modal = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  close: { fontSize: 16, color: colors.emerald },
  body: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    marginBottom: 4,
  },
  row: { flexDirection: "row", gap: 8, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.card,
    marginRight: 6,
  },
  chipActive: { borderColor: colors.emerald, backgroundColor: colors.emeraldBg },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.subtext },
  chipTextActive: { color: colors.emerald },
  dirBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  dirBuyActive: { borderColor: colors.emeraldBorder, backgroundColor: colors.emeraldBg },
  dirSellActive: { borderColor: colors.redBorder, backgroundColor: colors.redBg },
  dirText: { fontSize: 14, fontWeight: "700", color: colors.subtext },
  saveBtn: {
    marginTop: 24,
    backgroundColor: colors.emerald,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "800", color: "#000" },
});
