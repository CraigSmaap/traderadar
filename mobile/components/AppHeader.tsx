import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useDrawer } from "@/lib/DrawerContext";

export default function AppHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const { open } = useDrawer();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={open}
        hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.mid}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>{right ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mid: { flex: 1 },
  title: { fontSize: 19, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 11, color: colors.subtext, marginTop: 1 },
  right: { minWidth: 40, alignItems: "flex-end" },
});
