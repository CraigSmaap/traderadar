import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/colors";

const DRAWER_WIDTH = 268;

const NAV = [
  { label: "Live Signals", icon: "radio", route: "/(tabs)/signals" },
  { label: "Journal", icon: "book", route: "/(tabs)/journal" },
  { label: "Performance", icon: "bar-chart", route: "/(tabs)/performance" },
  { label: "Calculator", icon: "calculator", route: "/(tabs)/calculator" },
] as const;

export default function SideDrawer({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const slide = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const bg = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slide, {
          toValue: 0,
          useNativeDriver: true,
          damping: 28,
          stiffness: 220,
        }),
        Animated.timing(bg, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(bg, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  function nav(route: string) {
    onClose();
    setTimeout(() => router.replace(route as any), 60);
  }

  async function signOut() {
    onClose();
    await supabase.auth.signOut();
  }

  if (!mounted) return null;

  const overlayOpacity = bg.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.panel, { transform: [{ translateX: slide }] }]}>
          <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
            {/* Brand */}
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <Ionicons name="radio" size={20} color={colors.emerald} />
              </View>
              <View>
                <Text style={styles.brandName}>TradeRadar</Text>
                <Text style={styles.brandTag}>AI Signal Intelligence</Text>
              </View>
            </View>

            <View style={styles.sep} />

            {/* Nav items */}
            <View style={styles.nav}>
              <Text style={styles.navSection}>NAVIGATE</Text>
              {NAV.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.navItem}
                  onPress={() => nav(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.navIcon}>
                    <Ionicons name={item.icon as any} size={18} color={colors.emerald} />
                  </View>
                  <Text style={styles.navLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.dim} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flex: 1 }} />
            <View style={styles.sep} />

            <TouchableOpacity style={styles.signOut} onPress={signOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={colors.red} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#111113",
    borderRightWidth: 1,
    borderRightColor: colors.border,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 24,
    gap: 14,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.emeraldBg,
    borderWidth: 1,
    borderColor: colors.emeraldBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  brandTag: { fontSize: 11, color: colors.emerald, marginTop: 2, letterSpacing: 0.2 },
  sep: { height: 1, backgroundColor: colors.border },
  nav: { padding: 16 },
  navSection: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.dim,
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 2,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.emeraldBg,
    borderWidth: 1,
    borderColor: colors.emeraldBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 26,
    paddingVertical: 20,
  },
  signOutText: { fontSize: 14, fontWeight: "600", color: colors.red },
});
