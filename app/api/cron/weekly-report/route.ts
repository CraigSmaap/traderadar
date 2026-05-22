import { NextResponse } from "next/server";
import { Resend } from "resend";
import { fetchWeekStats, generateWeeklyReportPdf } from "@/lib/weeklyReport";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Last week's data (weeksAgo = 1 so the Monday cron captures the completed week)
    const stats = await fetchWeekStats(1);
    const pdfBuffer = await generateWeeklyReportPdf(stats);

    const weekSlug = stats.weekLabel.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\-]/g, "");
    const filename = `traderadar-weekly-${weekSlug}.pdf`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: ["hiveopps.core@gmail.com"],
      subject: `TradeRadar Weekly Report — ${stats.weekLabel}`,
      html: buildEmailHtml(stats),
      attachments: [
        {
          filename,
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      week: stats.weekLabel,
      signals: stats.total,
      winRate: `${stats.winRate}%`,
    });
  } catch (err) {
    console.error("WEEKLY REPORT CRON ERROR:", err);
    return NextResponse.json({ error: "Weekly report failed" }, { status: 500 });
  }
}

function buildEmailHtml(stats: ReturnType<typeof fetchWeekStats> extends Promise<infer T> ? T : never) {
  const winColor  = "#1a7a4a";
  const lossColor = "#e94560";
  const navy      = "#0f3460";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f6fb;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">

    <div style="background:${navy};padding:24px 28px;">
      <h1 style="color:#fff;margin:0;font-size:20px;letter-spacing:2px;">TRADERADAR</h1>
      <p style="color:#aac4e0;margin:6px 0 0;font-size:12px;">Weekly Signal Report · ${stats.weekLabel}</p>
    </div>

    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="text-align:center;padding:12px;background:#f4f6fb;border-radius:6px;">
            <div style="font-size:11px;color:#888;text-transform:uppercase;">Signals</div>
            <div style="font-size:28px;font-weight:bold;color:${navy};">${stats.total}</div>
          </td>
          <td style="width:8px;"></td>
          <td style="text-align:center;padding:12px;background:#f4f6fb;border-radius:6px;">
            <div style="font-size:11px;color:#888;text-transform:uppercase;">Win Rate</div>
            <div style="font-size:28px;font-weight:bold;color:${stats.winRate >= 50 ? winColor : lossColor};">${stats.winRate}%</div>
          </td>
          <td style="width:8px;"></td>
          <td style="text-align:center;padding:12px;background:#f4f6fb;border-radius:6px;">
            <div style="font-size:11px;color:#888;text-transform:uppercase;">Wins</div>
            <div style="font-size:28px;font-weight:bold;color:${winColor};">${stats.wins}</div>
          </td>
          <td style="width:8px;"></td>
          <td style="text-align:center;padding:12px;background:#f4f6fb;border-radius:6px;">
            <div style="font-size:11px;color:#888;text-transform:uppercase;">Losses</div>
            <div style="font-size:28px;font-weight:bold;color:${lossColor};">${stats.losses}</div>
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:#333;line-height:1.6;">
        The full breakdown is attached as a PDF including the signal log, per-asset performance,
        and optimization notes for next week.
      </p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/reports/weekly?secret=${process.env.CRON_SECRET}"
         style="display:inline-block;margin-top:16px;background:${navy};color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-size:13px;">
        View Online
      </a>
    </div>

    <div style="background:#f4f6fb;padding:14px 28px;font-size:11px;color:#aaa;">
      TradeRadar · Confidential · Auto-generated every Monday 07:00 SAST
    </div>
  </div>
</body>
</html>`;
}
