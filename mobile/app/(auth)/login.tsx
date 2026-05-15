import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) Alert.alert("Sign in failed", error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          Alert.alert("Sign up failed", error.message);
        } else {
          Alert.alert("Check your email", "A confirmation link has been sent to your email address.");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>TradeRadar</Text>
          <Text style={styles.tagline}>Smart setups. Real trades.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {mode === "login" ? "Sign in" : "Create account"}
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.dim}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.dim}
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnText}>
                {mode === "login" ? "Sign in" : "Create account"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => setMode(mode === "login" ? "signup" : "login")}
          >
            <Text style={styles.switchModeText}>
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Not financial advice. Trade at your own risk.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: "900",
    color: colors.emeraldLight,
    letterSpacing: -1,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: colors.subtext,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 15,
  },
  btn: {
    marginTop: 24,
    backgroundColor: colors.emerald,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#000",
  },
  switchMode: {
    marginTop: 16,
    alignItems: "center",
  },
  switchModeText: {
    fontSize: 13,
    color: colors.emerald,
  },
  disclaimer: {
    marginTop: 32,
    textAlign: "center",
    fontSize: 11,
    color: colors.dim,
  },
});
