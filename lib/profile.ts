import { createClient } from "@/lib/supabase/server";
import { resolveAccessTier, type AccessTier } from "@/lib/access";

export type UserRole = "trial" | "pro" | "admin" | "expired";

export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id,email,role,created_at")
    .eq("id", user.id)
    .single();

  return data;
}

export async function getEffectiveTier(): Promise<AccessTier> {
  const profile = await getCurrentProfile();
  if (!profile) return "expired";
  return resolveAccessTier(profile.role, profile.created_at);
}

export async function getCurrentRole(): Promise<UserRole> {
  const tier = await getEffectiveTier();
  return tier as UserRole;
}

export async function isAdmin() {
  const profile = await getCurrentProfile();
  return profile?.role === "admin";
}

export async function isPro() {
  const tier = await getEffectiveTier();
  return tier === "pro" || tier === "admin";
}