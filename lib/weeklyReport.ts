import { createClient } from "@supabase/supabase-js";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Colours ─────────────────────────────────────────────────────────────────
const NAVY  = "#0f3460";
const RED   = "#e94560";
const GREEN = "#1a7a4a";
const GREY  = "#888888";
const LIGHT = "#f4f6fb";

type SignalRow = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  stop_loss: number;
  tp1: number | null;
  tp2: number | null;
  status: string;
  result_label: string;
  pnl_percent: number | null;
  created_at: string;
  updated_at: string;
  asset_class: string | null;
};

type WeekStats = {
  weekLabel: string;
  from: string;
  to: string;
  total: number;
  wins: number;
  losses: number;
  breakevens: number;
  expired: number;
  open: number;
  winRate: number;
  avgWinPnl: number;
  avgLossPnl: number;
  byAsset: AssetStat[];
  signals: SignalRow[];
};

type AssetStat = {
  asset: string;
  total: number;
  wins: number;
  losses: number;
  breakevens: number;
  netPnl: number;
};

// ─── Data fetcher ─────────────────────────────────────────────────────────────

export async function fetchWeekStats(weeksAgo = 0): Promise<WeekStats> {
  // Week boundaries: Monday 00:00 UTC → Sunday 23:59 UTC
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sun
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const thisMonday = new Date(now);
  thisMonday.setUTCDate(now.getUTCDate() - daysToMonday - weeksAgo * 7);
  thisMonday.setUTCHours(0, 0, 0, 0);

  const thisSunday = new Date(thisMonday);
  thisSunday.setUTCDate(thisMonday.getUTCDate() + 6);
  thisSunday.setUTCHours(23, 59, 59, 999);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

  const weekLabel = `${fmt(thisMonday)} – ${fmt(thisSunday)}`;

  const { data, error } = await supabase
    .from("signal_results")
    .select("*")
    .gte("created_at", thisMonday.toISOString())
    .lte("created_at", thisSunday.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Supabase fetch error: ${error.message}`);

  const signals = (data || []) as SignalRow[];

  const closed = signals.filter((s) =>
    ["sl_hit", "tp1_hit", "tp2_hit", "tp3_hit", "tp1_only", "expired"].includes(s.status)
  );
  const wins      = closed.filter((s) => ["tp1_hit", "tp2_hit", "tp3_hit"].includes(s.status));
  const losses    = closed.filter((s) => s.status === "sl_hit");
  const breakevens = closed.filter((s) => s.status === "tp1_only");
  const expired   = closed.filter((s) => s.status === "expired");
  const open      = signals.filter((s) => ["open", "waiting", "tp1_running"].includes(s.status));

  const avgPnl = (rows: SignalRow[]) => {
    const valid = rows.filter((r) => r.pnl_percent != null);
    if (!valid.length) return 0;
    return valid.reduce((acc, r) => acc + (r.pnl_percent ?? 0), 0) / valid.length;
  };

  // Per-asset breakdown
  const assetMap = new Map<string, AssetStat>();
  for (const s of closed) {
    const prev = assetMap.get(s.asset) ?? { asset: s.asset, total: 0, wins: 0, losses: 0, breakevens: 0, netPnl: 0 };
    prev.total++;
    if (["tp1_hit", "tp2_hit", "tp3_hit"].includes(s.status)) prev.wins++;
    else if (s.status === "sl_hit") prev.losses++;
    else if (s.status === "tp1_only") prev.breakevens++;
    prev.netPnl += s.pnl_percent ?? 0;
    assetMap.set(s.asset, prev);
  }

  const byAsset = Array.from(assetMap.values()).sort((a, b) => b.total - a.total);

  return {
    weekLabel,
    from: thisMonday.toISOString(),
    to: thisSunday.toISOString(),
    total: signals.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    expired: expired.length,
    open: open.length,
    winRate: closed.length > 0 ? Math.round((wins.length / closed.length) * 100) : 0,
    avgWinPnl: avgPnl(wins),
    avgLossPnl: avgPnl(losses),
    byAsset,
    signals,
  };
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

export async function generateWeeklyReportPdf(stats: WeekStats): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 100; // usable width
    let y = 50;

    // ── helpers ────────────────────────────────────────────────────────────
    function hex(color: string) { return color; }

    function text(str: string, x: number, ty: number, opts: object = {}) {
      doc.text(str, x, ty, opts);
    }

    function fillRect(x: number, ry: number, w: number, h: number, color: string) {
      doc.save().rect(x, ry, w, h).fill(hex(color)).restore();
    }

    function hline(ly: number) {
      doc.save().moveTo(50, ly).lineTo(50 + W, ly).strokeColor("#dce3f0").lineWidth(0.5).stroke().restore();
    }

    function pnlColor(v: number) { return v > 0.05 ? GREEN : v < -0.05 ? RED : GREY; }

    // ── Header bar ─────────────────────────────────────────────────────────
    fillRect(0, 0, doc.page.width, 72, NAVY);
    doc.fillColor("#ffffff").fontSize(20).font("Helvetica-Bold")
      .text("TRADERADAR", 50, 18);
    doc.fontSize(9).font("Helvetica")
      .text("Weekly Signal Performance Report", 50, 44);
    doc.fontSize(9)
      .text(`Week: ${stats.weekLabel}`, 50, 56, { align: "right", width: W });

    y = 90;

    // ── Summary cards row ──────────────────────────────────────────────────
    const cards = [
      { label: "SIGNALS FIRED",  value: String(stats.total),           color: NAVY  },
      { label: "WIN RATE",       value: `${stats.winRate}%`,            color: stats.winRate >= 50 ? GREEN : RED },
      { label: "WINS",           value: String(stats.wins),             color: GREEN },
      { label: "LOSSES",         value: String(stats.losses),           color: RED   },
      { label: "BREAKEVEN",      value: String(stats.breakevens),       color: GREY  },
      { label: "STILL OPEN",     value: String(stats.open),             color: NAVY  },
    ];

    const cw = W / cards.length;
    cards.forEach((card, i) => {
      const cx = 50 + i * cw;
      fillRect(cx, y, cw - 4, 54, LIGHT);
      doc.fillColor(GREY).fontSize(7).font("Helvetica-Bold")
        .text(card.label, cx + 6, y + 8, { width: cw - 12 });
      doc.fillColor(card.color).fontSize(22).font("Helvetica-Bold")
        .text(card.value, cx + 6, y + 20, { width: cw - 12 });
    });

    y += 68;
    hline(y);
    y += 12;

    // ── Avg P&L row ────────────────────────────────────────────────────────
    doc.fillColor(NAVY).fontSize(9).font("Helvetica-Bold")
      .text("Average P&L", 50, y);
    y += 14;

    const pnlItems = [
      { label: "Avg win",       value: stats.avgWinPnl,   suffix: "%" },
      { label: "Avg loss",      value: stats.avgLossPnl,  suffix: "%" },
    ];
    pnlItems.forEach((item, i) => {
      const px = 50 + i * 160;
      doc.fillColor(GREY).fontSize(8).font("Helvetica").text(item.label, px, y);
      const val = item.value.toFixed(3);
      doc.fillColor(pnlColor(item.value)).fontSize(12).font("Helvetica-Bold")
        .text(`${item.value >= 0 ? "+" : ""}${val}${item.suffix}`, px, y + 11);
    });

    y += 38;
    hline(y);
    y += 12;

    // ── Asset breakdown table ──────────────────────────────────────────────
    doc.fillColor(NAVY).fontSize(9).font("Helvetica-Bold").text("Performance by Asset", 50, y);
    y += 14;

    if (stats.byAsset.length === 0) {
      doc.fillColor(GREY).fontSize(8).font("Helvetica").text("No closed signals this week.", 50, y);
      y += 18;
    } else {
      // Table header
      fillRect(50, y, W, 16, NAVY);
      const cols = [
        { label: "Asset",     x: 54,  w: 80  },
        { label: "Signals",   x: 140, w: 55  },
        { label: "Wins",      x: 200, w: 50  },
        { label: "Losses",    x: 254, w: 55  },
        { label: "Breakeven", x: 314, w: 70  },
        { label: "Net P&L",   x: 390, w: 70  },
      ];
      doc.fillColor("#ffffff").fontSize(7.5).font("Helvetica-Bold");
      cols.forEach((c) => text(c.label, c.x, y + 5));
      y += 16;

      stats.byAsset.forEach((row, idx) => {
        if (idx % 2 === 0) fillRect(50, y, W, 15, LIGHT);
        doc.fillColor("#333333").fontSize(8).font("Helvetica");
        text(row.asset,               cols[0].x, y + 4);
        text(String(row.total),       cols[1].x, y + 4);
        doc.fillColor(GREEN); text(String(row.wins),       cols[2].x, y + 4);
        doc.fillColor(RED);   text(String(row.losses),     cols[3].x, y + 4);
        doc.fillColor(GREY);  text(String(row.breakevens), cols[4].x, y + 4);
        const net = row.netPnl.toFixed(3);
        doc.fillColor(pnlColor(row.netPnl));
        text(`${row.netPnl >= 0 ? "+" : ""}${net}%`, cols[5].x, y + 4);
        y += 15;
      });
    }

    y += 10;
    hline(y);
    y += 12;

    // ── Signal log ─────────────────────────────────────────────────────────
    doc.fillColor(NAVY).fontSize(9).font("Helvetica-Bold").text("Signal Log", 50, y);
    y += 14;

    if (stats.signals.length === 0) {
      doc.fillColor(GREY).fontSize(8).font("Helvetica").text("No signals this week.", 50, y);
    } else {
      // Table header
      fillRect(50, y, W, 16, NAVY);
      const logCols = [
        { label: "Date",      x: 54,  w: 62 },
        { label: "Asset",     x: 120, w: 55 },
        { label: "Dir",       x: 178, w: 30 },
        { label: "Entry",     x: 212, w: 65 },
        { label: "SL",        x: 281, w: 65 },
        { label: "TP1",       x: 350, w: 65 },
        { label: "Result",    x: 418, w: 80 },
      ];
      doc.fillColor("#ffffff").fontSize(7.5).font("Helvetica-Bold");
      logCols.forEach((c) => text(c.label, c.x, y + 5));
      y += 16;

      for (let i = 0; i < stats.signals.length; i++) {
        const s = stats.signals[i];

        // New page if needed
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 50;
        }

        if (i % 2 === 0) fillRect(50, y, W, 14, LIGHT);

        const dateStr = new Date(s.created_at).toLocaleDateString("en-ZA", {
          day: "2-digit", month: "short", timeZone: "UTC",
        });

        doc.fillColor("#333").fontSize(7.5).font("Helvetica");
        text(dateStr, logCols[0].x, y + 3);
        text(s.asset, logCols[1].x, y + 3);

        doc.fillColor(s.direction === "BUY" ? GREEN : RED).font("Helvetica-Bold");
        text(s.direction, logCols[2].x, y + 3);

        doc.fillColor("#333").font("Helvetica");
        text(String(s.entry_price), logCols[3].x, y + 3);
        text(String(s.stop_loss),   logCols[4].x, y + 3);
        text(s.tp1 != null ? String(s.tp1) : "—", logCols[5].x, y + 3);

        const isWin  = ["tp1_hit","tp2_hit","tp3_hit"].includes(s.status);
        const isLoss = s.status === "sl_hit";
        doc.fillColor(isWin ? GREEN : isLoss ? RED : GREY).font("Helvetica-Bold");
        text(s.result_label, logCols[6].x, y + 3);

        y += 14;
      }
    }

    // ── Optimization notes ─────────────────────────────────────────────────
    const notes = buildOptimizationNotes(stats);
    if (notes.length > 0) {
      if (y > doc.page.height - 120) { doc.addPage(); y = 50; }
      y += 10;
      hline(y);
      y += 12;

      doc.fillColor(NAVY).fontSize(9).font("Helvetica-Bold").text("Optimization Notes", 50, y);
      y += 14;

      notes.forEach((note) => {
        if (y > doc.page.height - 60) { doc.addPage(); y = 50; }
        fillRect(50, y, W, 1, RED);
        y += 6;
        doc.fillColor("#333").fontSize(8).font("Helvetica")
          .text(`• ${note}`, 54, y, { width: W - 8 });
        y += doc.currentLineHeight() * 1.4 + 6;
      });
    }

    // ── Footer ─────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 36;
    fillRect(0, footerY, doc.page.width, 36, NAVY);
    doc.fillColor("#aaaaaa").fontSize(7).font("Helvetica")
      .text(
        `TradeRadar · Generated ${new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })} · Confidential`,
        50, footerY + 14, { align: "center", width: W }
      );

    doc.end();
  });
}

// ─── Auto optimization notes ──────────────────────────────────────────────────

function buildOptimizationNotes(stats: WeekStats): string[] {
  const notes: string[] = [];

  if (stats.winRate < 40 && stats.losses > 0) {
    notes.push(`Win rate is ${stats.winRate}% — below the 40% target. Review entry conditions and consider raising the score threshold.`);
  }

  if (stats.winRate >= 60) {
    notes.push(`Strong win rate of ${stats.winRate}% this week. System performing well — no major changes needed.`);
  }

  // Assets with multiple SL hits
  const problematic = stats.byAsset.filter((a) => a.losses >= 3);
  problematic.forEach((a) => {
    notes.push(`${a.asset} hit SL ${a.losses} times this week. The 4-hour cooldown is active but consider whether the signal threshold needs raising for this asset.`);
  });

  // Assets with perfect win record
  const clean = stats.byAsset.filter((a) => a.wins > 0 && a.losses === 0 && a.total >= 2);
  clean.forEach((a) => {
    notes.push(`${a.asset} had ${a.wins} wins and no losses (${a.total} signals) — strong performer this week.`);
  });

  // High breakeven rate
  const totalClosed = stats.wins + stats.losses + stats.breakevens;
  if (totalClosed > 0 && stats.breakevens / totalClosed > 0.3) {
    notes.push(`${stats.breakevens} of ${totalClosed} closed signals ended at breakeven (TP1 reversed to entry). Closing 50% of the position at TP1 would have converted these to small wins.`);
  }

  if (stats.total === 0) {
    notes.push("No signals fired this week. Check that the market API cron is running and asset filters are not too restrictive.");
  }

  return notes;
}
