import { useState } from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { DrawerContext } from "@/lib/DrawerContext";
import SideDrawer from "@/components/SideDrawer";

function icon(name: string, focused: string) {
  return ({ color, focused: f }: { color: string; focused: boolean }) => (
    <Ionicons name={(f ? focused : `${focused}-outline`) as any} size={23} color={color} />
  );
}

export default function TabLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <DrawerContext.Provider value={{ open: () => setDrawerOpen(true) }}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#111113",
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 68,
              paddingBottom: 10,
              paddingTop: 8,
            },
            tabBarActiveTintColor: colors.emerald,
            tabBarInactiveTintColor: colors.dim,
            tabBarLabelStyle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
          }}
        >
          <Tabs.Screen
            name="signals"
            options={{
              title: "Signals",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? "radio" : "radio-outline"} size={23} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="journal"
            options={{
              title: "Journal",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? "book" : "book-outline"} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="performance"
            options={{
              title: "Stats",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="calculator"
            options={{
              title: "Calc",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? "calculator" : "calculator-outline"} size={22} color={color} />
              ),
            }}
          />
        </Tabs>

        <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </View>
    </DrawerContext.Provider>
  );
}
