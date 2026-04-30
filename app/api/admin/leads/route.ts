import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      supabase,
      error: NextResponse.json({ error: "Not authorized" }, { status: 403 }),
    };
  }

  return { supabase, error: null };
}

export async function GET() {
  const { supabase, error } = await requireAdmin();

  if (error) return error;

  const { data, error: leadsError } = await supabase
    .from("leads")
    .select("id,email,source,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (leadsError) {
    return NextResponse.json(
      { ok: false, message: leadsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}