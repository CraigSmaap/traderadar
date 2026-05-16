import { View } from "react-native";
import { Tabs } from "expo-router";
import { colors } from "@/constants/colors";

function TabIcon({ focused, color }: { name: string; focused: boolean; color: string }) {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: focused ? 6 : 4,
          height: focused ? 6 : 4,
          borderRadius: 3,
          backgroundColor: color,
          marginBottom: 2,
        }}
      />
    </View>
  );
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
          tabBarIcon: ({ focused, color }) => <TabIcon name="signals" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ focused, color }) => <TabIcon name="journal" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="performance"
        options={{
          title: "Performance",
          tabBarIcon: ({ focused, color }) => <TabIcon name="performance" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: "Calculator",
          tabBarIcon: ({ focused, color }) => <TabIcon name="calculator" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}
