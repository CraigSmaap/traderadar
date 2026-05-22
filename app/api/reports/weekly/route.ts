import { NextRequest, NextResponse } from "next/server";
import { fetchWeekStats, generateWeeklyReportPdf } from "@/lib/weeklyReport";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weeksAgo = Number(req.nextUrl.searchParams.get("weeksAgo") ?? "0");

  try {
    const stats = await fetchWeekStats(weeksAgo);
    const pdfBuffer = await generateWeeklyReportPdf(stats);

    const weekSlug = stats.weekLabel.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\-]/g, "");

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="traderadar-weekly-${weekSlug}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("WEEKLY REPORT ERROR:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
