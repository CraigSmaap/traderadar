import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Verify the user's JWT
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Read current profile — don't downgrade pro/admin users
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "pro" || profile?.role === "admin") {
    return NextResponse.json({ message: "Already on a paid plan" });
  }

  if (profile?.role === "exness-trial") {
    return NextResponse.json({ message: "Already claimed" });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "exness-trial" })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update trial" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "30-day trial activated" });
}
