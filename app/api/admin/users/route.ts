import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Role = "free" | "pro" | "admin";

function isValidRole(role: unknown): role is Role {
  return role === "free" || role === "pro" || role === "admin";
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
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
      user,
      error: NextResponse.json({ error: "Not authorized" }, { status: 403 }),
    };
  }

  return { supabase, user, error: null };
}

export async function GET() {
  const { supabase, error } = await requireAdmin();

  if (error) return error;

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id, email, role, created_at, pro_granted_reason, pro_expires_at")
    .order("created_at", { ascending: false });

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  return NextResponse.json(users);
}

export async function PATCH(request: NextRequest) {
  const { supabase, user, error } = await requireAdmin();

  if (error) return error;

  const body = await request.json();

  const userId = body?.userId;
  const role = body?.role;
  const reason = body?.reason || null;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  if (!isValidRole(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (user && user.id === userId) {
    return NextResponse.json(
      { error: "You cannot change your own admin role." },
      { status: 400 }
    );
  }

  const updatePayload = {
    role,
    pro_granted_reason: role === "pro" ? reason : null,
    pro_expires_at: null,
  };

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}