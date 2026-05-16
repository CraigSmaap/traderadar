import { useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/constants/colors";
import { DrawerContext } from "@/lib/DrawerContext";
import SideDrawer from "@/components/SideDrawer";

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <DrawerContext.Provider value={{ open: () => setDrawerOpen(true) }}>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "none",
          }}
        />
        <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </View>
    </DrawerContext.Provider>
  );
}
