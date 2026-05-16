import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/colors";
import * as Notifications from "expo-notifications";

const API_URL = "https://traderadar.co.za";
const PROJECT_ID = "9a5f77bb-c464-4506-be42-2c2135532dc7";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerPushToken(accessToken: string) {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });

    await fetch(`${API_URL}/api/push/expo-subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch (e) {
    console.warn("Push registration failed:", e);
  }
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
      if (s) registerPushToken(s.access_token);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) registerPushToken(s.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === "(auth)";

    if (!session && !inAuth) {
      router.replace("/(auth)/login");
    } else if (session && inAuth) {
      router.replace("/(tabs)/signals");
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.emerald} size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
