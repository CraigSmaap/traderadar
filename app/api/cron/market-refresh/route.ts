import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/market`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          source: "cron-market-refresh",
          error: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      source: "cron-market-refresh",
      refreshedAt: new Date().toISOString(),
      market: data,
    });
  } catch (error) {
    console.error("CRON MARKET REFRESH ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        source: "cron-market-refresh",
        error: "Cron market refresh failed",
      },
      { status: 500 }
    );
  }
}