import { NextResponse } from "next/server";
import { getTopMovers, getTopMoverSignals } from "@/lib/topMovers";

export async function GET() {
  const movers = await getTopMovers(10);
  const signals = await getTopMoverSignals(10);

  return NextResponse.json({
    ok: true,
    source: "yahoo-public-chart-api",
    generatedAt: new Date().toISOString(),
    movers,
    signals,
  });
}