import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import type { SignalResult } from "@/lib/types";
import { colors } from "@/constants/colors";
import SignalCard from "@/components/SignalCard";
import AppHeader from "@/components/AppHeader";

type Section = { title: string; data: SignalResult[] };

function buildSections(results: SignalResult[]): Section[] {
  const active = results.filter((r) => r.status === "waiting" || r.status === "open");
  const closed = results.filter((r) =>
    ["tp1_hit", "tp2_hit", "tp3_hit", "sl_hit", "expired"].includes(r.status)
  );

  const sections: Section[] = [];
  if (active.length > 0) sections.push({ title: "Active Signals", data: active });
  if (closed.length > 0) sections.push({ title: "Recent Closed", data: closed.slice(0, 20) });
  return sections;
}

export default function SignalsScreen() {
  const [results, setResults] = useState<SignalResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("signal_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      Alert.alert("Error", "Failed to load signals.");
    } else {
      setResults((data || []) as SignalResult[]);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();

    // Realtime subscription for live updates
    const channel = supabase
      .channel("signal_results_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "signal_results" }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const sections = buildSections(results);

  function renderItem({ item }: { item: SignalResult }) {
    return <SignalCard result={item} />;
  }

  function renderSectionHeader(title: string) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    );
  }

  type FlatItem = SignalResult | { _sectionHeader: string };

  const flatItems: FlatItem[] = sections.flatMap((s) => [
    { _sectionHeader: s.title },
    ...s.data,
  ]);

  function renderFlatItem({ item }: { item: FlatItem }) {
    if ("_sectionHeader" in item) {
      return renderSectionHeader(item._sectionHeader);
    }
    return renderItem({ item });
  }

  const liveCount = results.filter((r) => r.status === "open" || r.status === "waiting").length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader
        title="Live Signals"
        subtitle={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}` : undefined}
        right={
          <View style={[styles.livePill, { borderColor: liveCount > 0 ? colors.emeraldBorder : colors.border }]}>
            <View style={[styles.dot, { backgroundColor: liveCount > 0 ? colors.emerald : colors.dim }]} />
            <Text style={[styles.liveText, { color: liveCount > 0 ? colors.emerald : colors.dim }]}>
              {liveCount > 0 ? liveCount : "–"}
            </Text>
          </View>
        }
      />

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={colors.emerald} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No signals yet</Text>
          <Text style={styles.emptySub}>
            Pull to refresh. The scanner runs every 30 minutes.
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={flatItems}
          keyExtractor={(item, i) => ("_sectionHeader" in item ? `section-${i}` : item.id)}
          renderItem={renderFlatItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.emerald}
            />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.card,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: "700" },
  list: { padding: 16, gap: 12 },
  sectionHeader: { paddingVertical: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.emerald,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: "center",
    lineHeight: 22,
  },
  refreshBtn: {
    marginTop: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  refreshBtnText: { fontSize: 14, fontWeight: "700", color: colors.text },
});
