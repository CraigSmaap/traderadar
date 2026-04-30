import { createClient } from "@/lib/supabase/server";

export type UserRole = "free" | "pro" | "admin";

export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("id", user.id)
    .single();

  return data;
}

export async function getCurrentRole(): Promise<UserRole> {
  const profile = await getCurrentProfile();

  if (!profile) return "free";

  return (profile.role as UserRole) || "free";
}

export async function isAdmin() {
  const role = await getCurrentRole();
  return role === "admin";
}

export async function isPro() {
  const role = await getCurrentRole();
  return role === "pro" || role === "admin";
}