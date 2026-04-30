import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const source = String(body.source || "homepage").trim();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from("leads").insert({
      email,
      source,
      status: "new",
    });

    console.log("LEAD INSERT:", { email, error });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({
          ok: true,
          message: "You are already on the early access list.",
        });
      }

      return NextResponse.json(
        {
          ok: false,
          message: "Could not save lead.",
          debug: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "You are on the early access list.",
    });
  } catch (error) {
    console.log("LEAD ROUTE ERROR:", error);

    return NextResponse.json(
      { ok: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}