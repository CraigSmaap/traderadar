import { Tabs } from "expo-router";
import { colors } from "@/constants/colors";

function TabIcon({ focused, color }: { focused: boolean; color: string }) {
  void focused;
  void color;
  return null;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: colors.emerald,
        tabBarInactiveTintColor: colors.dim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="signals"
        options={{
          title: "Signals",
          tabBarIcon: ({ color }) => <TabIcon focused={false} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ color }) => <TabIcon focused={false} color={color} />,
        }}
      />
      <Tabs.Screen
        name="performance"
        options={{
          title: "Performance",
          tabBarIcon: ({ color }) => <TabIcon focused={false} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: "Calculator",
          tabBarIcon: ({ color }) => <TabIcon focused={false} color={color} />,
        }}
      />
    </Tabs>
  );
}
