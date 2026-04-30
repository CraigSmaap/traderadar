import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Payments are not live yet. Pro upgrades are currently handled by admin only.",
    },
    { status: 403 }
  );
}