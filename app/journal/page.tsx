"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";

type JournalEntry = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  exit_price: number | null;
  lot_size: number | null;
  pnl_amount: number | null;
  pnl_percent: number | null;
  emotion: string | null;
  notes: string | null;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
};

type SignalResult = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  entry_zone_low?: number | null;
  entry_zone_high?: number | null;
  stop_loss: number;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  status: string;
  pnl_percent?: number | null;
};

type CalendarDay = {
  date: string;
  pnl: number;
  trades: number;
  avgDiscipline: number | null;
};

const ASSETS = [
  "XAUUSD",
  "BTCUSD",
  "ETHUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "USDZAR",
  "US30",
  "NAS100",
  "SPX500",
  "XAGUSD",
  "USOIL",
  "BRENT",
  "MTN",
  "GFI",
  "NPN",
  "J200",
  "SOL",
];

const emotions = [
  "Calm",
  "Confident",
  "Focused",
  "FOMO",
  "Hesitant",
  "Anxious",
  "Revenge",
];

function calculatePnl(
  direction: "BUY" | "SELL",
  entry: number,
  exit: number,
  lot: number
) {
  const difference = direction === "BUY" ? exit - entry : entry - exit;
  return difference * lot * 100;
}

function calculateRiskReward(
  direction: "BUY" | "SELL",
  entry: number,
  stopLoss: number,
  exit: number
) {
  const risk = Math.abs(entry - stopLoss);
  if (!risk) return null;

  const reward = direction === "BUY" ? exit - entry : entry - exit;
  return reward / risk;
}

function extractDiscipline(notes?: string | null) {
  if (!notes) return null;

  const match = notes.match(/Discipline Score:\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function extractMistake(notes?: string | null) {
  if (!notes) return null;

  const match = notes.match(/Mistake:\s*(.+)/);
  return match ? match[1].trim() : null;
}

function getDateKey(dateValue: string) {
  return new Date(dateValue).toISOString().split("T")[0];
}

function formatNumber(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";

  return value.toLocaleString("en-US", {
    maximumFractionDigits: value > 100 ? 2 : 5,
  });
}

function getCalendarClass(day: CalendarDay) {
  if (day.trades === 0) return "border-zinc-800 bg-zinc-950 text-zinc-600";
  if (day.pnl > 0) return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
  if (day.pnl < 0) return "border-red-500/40 bg-red-500/15 text-red-300";
  return "border-yellow-500/40 bg-yellow-500/15 text-yellow-300";
}

function getDisciplineClass(score: number) {
  if (score >= 70) return "bg-emerald-400 text-black";
  if (score >= 50) return "bg-yellow-400 text-black";
  return "bg-red-500 text-white";
}

export default function JournalPage() {
  return (
    <Suspense fallback={<JournalLoading />}>
      <JournalPageContent />
    </Suspense>
  );
}

function JournalLoading() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-zinc-400">Loading journal...</p>
      </section>
    </main>
  );
}

function JournalPageContent() {
  const searchParams = useSearchParams();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [signals, setSignals] = useState<SignalResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSignalId, setSelectedSignalId] = useState("");
  const [asset, setAsset] = useState("");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [emotionBefore, setEmotionBefore] = useState("Calm");
  const [emotionAfter, setEmotionAfter] = useState("Calm");
  const [followedPlan, setFollowedPlan] = useState(true);
  const [mistakeTag, setMistakeTag] = useState("None");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadEntries() {
    setLoading(true);

    const response = await fetch("/api/journal", { cache: "no-store" });

    if (response.ok) {
      setEntries((await response.json()) as JournalEntry[]);
    }

    setLoading(false);
  }

  async function loadSignals() {
    const response = await fetch(`/api/signals?ts=${Date.now()}`, {
      cache: "no-store",
    });

    if (response.ok) {
      const json = (await response.json()) as SignalResult[];
      setSignals(Array.isArray(json) ? json : []);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadEntries();
      loadSignals();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const assetParam = searchParams.get("asset");
      const directionParam = searchParams.get("direction");
      const entryParam = searchParams.get("entry");

      if (assetParam) setAsset(assetParam.toUpperCase());

      if (directionParam === "BUY" || directionParam === "SELL") {
        setDirection(directionParam);
      }

      if (entryParam) setEntryPrice(entryParam);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [searchParams]);

  function applySignal(signalId: string) {
    setSelectedSignalId(signalId);

    const signal = signals.find((item) => item.id === signalId);
    if (!signal) return;

    setAsset(signal.asset);
    setDirection(signal.direction);
    setEntryPrice(String(signal.entry_price));
    setStopLoss(String(signal.stop_loss));
    setTakeProfit(String(signal.tp3 ?? signal.tp2 ?? signal.tp1 ?? ""));
  }

  const calculatedPnl = useMemo(() => {
    const entry = Number(entryPrice);
    const exit = Number(exitPrice);
    const lot = Number(lotSize);

    if (!entryPrice || !exitPrice || !lotSize) return null;

    if (Number.isNaN(entry) || Number.isNaN(exit) || Number.isNaN(lot)) {
      return null;
    }

    return calculatePnl(direction, entry, exit, lot);
  }, [direction, entryPrice, exitPrice, lotSize]);

  const plannedRr = useMemo(() => {
    const entry = Number(entryPrice);
    const sl = Number(stopLoss);
    const tp = Number(takeProfit);

    if (!entry || !sl || !tp) return null;

    return calculateRiskReward(direction, entry, sl, tp);
  }, [direction, entryPrice, stopLoss, takeProfit]);

  const actualRr = useMemo(() => {
    const entry = Number(entryPrice);
    const sl = Number(stopLoss);
    const exit = Number(exitPrice);

    if (!entry || !sl || !exit) return null;

    return calculateRiskReward(direction, entry, sl, exit);
  }, [direction, entryPrice, stopLoss, exitPrice]);

  const disciplineScore = useMemo(() => {
    let score = 100;

    if (!followedPlan) score -= 35;
    if (emotionBefore === "FOMO" || emotionBefore === "Revenge") score -= 25;
    if (emotionBefore === "Anxious") score -= 15;
    if (mistakeTag !== "None") score -= 20;

    if (actualRr !== null && plannedRr !== null && actualRr < plannedRr * 0.5) {
      score -= 15;
    }

    return Math.max(score, 0);
  }, [followedPlan, emotionBefore, mistakeTag, actualRr, plannedRr]);

  const disciplineHistory = useMemo(() => {
    return entries
      .slice(0, 10)
      .map((entry) => extractDiscipline(entry.notes))
      .filter((score): score is number => score !== null);
  }, [entries]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    const days: CalendarDay[] = [];

    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const dateKey = date.toISOString().split("T")[0];
      const dayEntries = entries.filter(
        (entry) => getDateKey(entry.opened_at) === dateKey
      );

      const pnl = dayEntries.reduce(
        (sum, entry) => sum + Number(entry.pnl_amount || 0),
        0
      );

      const scores = dayEntries
        .map((entry) => extractDiscipline(entry.notes))
        .filter((score): score is number => score !== null);

      const avgDiscipline =
        scores.length === 0
          ? null
          : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

      days.push({
        date: dateKey,
        pnl,
        trades: dayEntries.length,
        avgDiscipline,
      });
    }

    return days;
  }, [entries]);

  const streakStats = useMemo(() => {
    const sortedDays = [...calendarDays].sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    let journalStreak = 0;
    let disciplineStreak = 0;

    for (const day of sortedDays) {
      if (day.trades > 0) journalStreak += 1;
      else break;
    }

    for (const day of sortedDays) {
      if (day.trades > 0 && day.avgDiscipline !== null && day.avgDiscipline >= 70) {
        disciplineStreak += 1;
      } else if (day.trades > 0) {
        break;
      } else {
        break;
      }
    }

    const activeDays = calendarDays.filter((day) => day.trades > 0);

    const bestDay =
      [...activeDays].sort((a, b) => b.pnl - a.pnl)[0] || null;

    const worstDay =
      [...activeDays].sort((a, b) => a.pnl - b.pnl)[0] || null;

    return {
      journalStreak,
      disciplineStreak,
      bestDay,
      worstDay,
    };
  }, [calendarDays]);

  const patternInsight = useMemo(() => {
    const scoredEntries = entries
      .map((entry) => ({
        entry,
        score: extractDiscipline(entry.notes),
        mistake: extractMistake(entry.notes),
      }))
      .filter((item) => item.score !== null);

    const lowDisciplineTrades = scoredEntries.filter(
      (item) => Number(item.score) < 50
    );

    const mistakeCounts: Record<string, number> = {};

    scoredEntries.forEach((item) => {
      if (!item.mistake || item.mistake === "None") return;
      mistakeCounts[item.mistake] = (mistakeCounts[item.mistake] || 0) + 1;
    });

    const topMistake =
      Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      null;

    if (scoredEntries.length === 0) {
      return "Log a few trades to unlock discipline patterns.";
    }

    if (topMistake) {
      return `Main leak detected: ${topMistake}. Fix this before increasing trade size.`;
    }

    if (lowDisciplineTrades.length > 0) {
      return `You had ${lowDisciplineTrades.length} low-discipline trade${
        lowDisciplineTrades.length === 1 ? "" : "s"
      }. Review those before taking more setups.`;
    }

    return "Discipline looks controlled. Keep following the plan.";
  }, [entries]);

  const stats = useMemo(() => {
    const closed = entries.filter((entry) => entry.status === "closed");

    const totalPnl = closed.reduce(
      (sum, entry) => sum + Number(entry.pnl_amount || 0),
      0
    );

    const wins = closed.filter((entry) => Number(entry.pnl_amount || 0) > 0);
    const losses = closed.filter((entry) => Number(entry.pnl_amount || 0) < 0);

    const winRate =
      closed.length === 0 ? 0 : Math.round((wins.length / closed.length) * 100);

    const avgWin =
      wins.length === 0
        ? 0
        : wins.reduce((sum, entry) => sum + Number(entry.pnl_amount || 0), 0) /
          wins.length;

    const avgLoss =
      losses.length === 0
        ? 0
        : losses.reduce(
            (sum, entry) => sum + Number(entry.pnl_amount || 0),
            0
          ) / losses.length;

    const assetMap: Record<string, number> = {};
    const emotionMap: Record<string, number> = {};

    closed.forEach((entry) => {
      assetMap[entry.asset] =
        (assetMap[entry.asset] || 0) + Number(entry.pnl_amount || 0);

      if (entry.emotion) {
        emotionMap[entry.emotion] =
          (emotionMap[entry.emotion] || 0) + Number(entry.pnl_amount || 0);
      }
    });

    const bestAsset =
      Object.entries(assetMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const bestEmotion =
      Object.entries(emotionMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const averageDiscipline =
      disciplineHistory.length === 0
        ? 0
        : Math.round(
            disciplineHistory.reduce((sum, score) => sum + score, 0) /
              disciplineHistory.length
          );

    return {
      totalTrades: entries.length,
      openTrades: entries.filter((entry) => entry.status === "open").length,
      totalPnl,
      winRate,
      avgWin,
      avgLoss,
      bestAsset,
      bestEmotion,
      averageDiscipline,
    };
  }, [entries, disciplineHistory]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const entryNumber = Number(entryPrice);
    const exitNumber = exitPrice ? Number(exitPrice) : null;
    const lotNumber = lotSize ? Number(lotSize) : null;

    const pnlNumber =
      exitNumber !== null && lotNumber !== null
        ? calculatePnl(direction, entryNumber, exitNumber, lotNumber)
        : null;

    const enhancedNotes = [
      notes,
      "",
      "--- TradeRadar Discipline Data ---",
      `Signal ID: ${selectedSignalId || "manual"}`,
      `Followed Plan: ${followedPlan ? "YES" : "NO"}`,
      `Planned RR: ${plannedRr === null ? "N/A" : plannedRr.toFixed(2)}`,
      `Actual RR: ${actualRr === null ? "N/A" : actualRr.toFixed(2)}`,
      `Discipline Score: ${disciplineScore}/100`,
      `Emotion Before: ${emotionBefore}`,
      `Emotion After: ${emotionAfter}`,
      `Mistake: ${mistakeTag}`,
    ].join("\n");

    const response = await fetch("/api/journal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset,
        direction,
        entry_price: entryNumber,
        exit_price: exitNumber,
        lot_size: lotNumber,
        pnl_amount: pnlNumber,
        pnl_percent:
          pnlNumber !== null && entryNumber !== 0
            ? (pnlNumber / entryNumber) * 100
            : null,
        emotion: emotionAfter,
        notes: enhancedNotes,
        source_signal_id: selectedSignalId || null,
        status: exitNumber !== null && lotNumber !== null ? "closed" : "open",
      }),
    });

    if (response.ok) {
      setSelectedSignalId("");
      setAsset("");
      setDirection("BUY");
      setEntryPrice("");
      setStopLoss("");
      setTakeProfit("");
      setExitPrice("");
      setLotSize("");
      setEmotionBefore("Calm");
      setEmotionAfter("Calm");
      setFollowedPlan(true);
      setMistakeTag("None");
      setNotes("");
      await loadEntries();
    } else {
      const data = await response.json();
      alert(data.error || "Could not save journal entry.");
    }

    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),linear-gradient(135deg,rgba(24,24,27,0.96),rgba(6,6,8,0.99))] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Trading Journal
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">
            Measure discipline, not just profit.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
            Link trades to TradeRadar signals, compare the plan against your
            execution, and expose emotional mistakes before they cost you money.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Trades" value={stats.totalTrades} />
          <StatCard label="Open Trades" value={stats.openTrades} />
          <StatCard label="Win Rate" value={`${stats.winRate}%`} />
          <StatCard
            label="Total PnL"
            value={`$${stats.totalPnl.toFixed(2)}`}
            color={stats.totalPnl >= 0 ? "text-emerald-300" : "text-red-300"}
          />
          <StatCard
            label="Avg Win"
            value={`$${stats.avgWin.toFixed(2)}`}
            color="text-emerald-300"
          />
          <StatCard
            label="Avg Loss"
            value={`$${stats.avgLoss.toFixed(2)}`}
            color="text-red-300"
          />
          <StatCard label="Best Asset" value={stats.bestAsset} />
          <StatCard label="Best Emotion" value={stats.bestEmotion} />
          <StatCard
            label="Journal Streak"
            value={`${streakStats.journalStreak} day${
              streakStats.journalStreak === 1 ? "" : "s"
            }`}
            color="text-emerald-300"
          />
          <StatCard
            label="Discipline Streak"
            value={`${streakStats.disciplineStreak} day${
              streakStats.disciplineStreak === 1 ? "" : "s"
            }`}
            color="text-emerald-300"
          />
          <StatCard
            label="Avg Discipline"
            value={
              stats.averageDiscipline === 0
                ? "—"
                : `${stats.averageDiscipline}/100`
            }
            color={
              stats.averageDiscipline >= 70
                ? "text-emerald-300"
                : stats.averageDiscipline >= 45
                  ? "text-yellow-300"
                  : "text-red-300"
            }
          />
          <StatCard
            label="Signal Linked"
            value={selectedSignalId ? "YES" : "NO"}
            color={selectedSignalId ? "text-emerald-300" : "text-yellow-300"}
          />
        </div>

        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Trader Calendar
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Last 30 trading days
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Green means profitable. Red means losing. Yellow means flat or
                open. Empty means no journal entry.
              </p>
            </div>

            <div className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Best Day
                </p>
                <p className="mt-1 font-black text-emerald-300">
                  {streakStats.bestDay
                    ? `${streakStats.bestDay.date} · $${streakStats.bestDay.pnl.toFixed(2)}`
                    : "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Worst Day
                </p>
                <p className="mt-1 font-black text-red-300">
                  {streakStats.worstDay
                    ? `${streakStats.worstDay.date} · $${streakStats.worstDay.pnl.toFixed(2)}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {calendarDays.map((day) => (
              <div
                key={day.date}
                className={`rounded-2xl border p-3 text-center ${getCalendarClass(
                  day
                )}`}
                title={`${day.date} · Trades: ${day.trades} · PnL: $${day.pnl.toFixed(
                  2
                )} · Discipline: ${day.avgDiscipline ?? "—"}`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
                  {day.date.slice(5)}
                </p>
                <p className="mt-1 text-sm font-black">{day.trades}</p>
                <p className="mt-1 text-[10px] opacity-80">
                  {day.avgDiscipline === null ? "—" : `${day.avgDiscipline}`}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Discipline Trend
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Last 10 scored trades
              </h2>
              <p className="mt-2 text-sm text-zinc-400">{patternInsight}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Current Score
              </p>
              <p
                className={`mt-1 text-3xl font-black ${
                  disciplineScore >= 70
                    ? "text-emerald-300"
                    : disciplineScore >= 45
                      ? "text-yellow-300"
                      : "text-red-300"
                }`}
              >
                {disciplineScore}/100
              </p>
            </div>
          </div>

          {disciplineHistory.length === 0 ? (
            <p className="mt-5 text-sm text-zinc-500">
              No discipline history yet. Save scored trades to build your
              pattern.
            </p>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2">
              {disciplineHistory.map((score, index) => (
                <div
                  key={`${score}-${index}`}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xs font-black ${getDisciplineClass(
                    score
                  )}`}
                  title={`Discipline Score: ${score}/100`}
                >
                  {score}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Add Trade
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <Field label="TradeRadar Signal">
              <select
                value={selectedSignalId}
                onChange={(event) => applySignal(event.target.value)}
                className="input"
              >
                <option value="">Manual trade / choose signal</option>
                {signals.map((signal) => (
                  <option key={signal.id} value={signal.id}>
                    {signal.asset} · {signal.direction} · Entry{" "}
                    {formatNumber(signal.entry_price)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Asset">
              <select
                value={asset}
                onChange={(event) => setAsset(event.target.value)}
                required
                className="input"
              >
                <option value="">Select asset</option>
                {ASSETS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Direction">
              <select
                value={direction}
                onChange={(event) =>
                  setDirection(event.target.value as "BUY" | "SELL")
                }
                className="input"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </Field>

            <Field label="Entry Price">
              <input
                value={entryPrice}
                onChange={(event) => setEntryPrice(event.target.value)}
                required
                type="number"
                step="0.00001"
                className="input"
              />
            </Field>

            <Field label="Stop Loss">
              <input
                value={stopLoss}
                onChange={(event) => setStopLoss(event.target.value)}
                type="number"
                step="0.00001"
                className="input"
              />
            </Field>

            <Field label="Planned Take Profit">
              <input
                value={takeProfit}
                onChange={(event) => setTakeProfit(event.target.value)}
                type="number"
                step="0.00001"
                className="input"
              />
            </Field>

            <Field label="Exit Price">
              <input
                value={exitPrice}
                onChange={(event) => setExitPrice(event.target.value)}
                type="number"
                step="0.00001"
                className="input"
              />
            </Field>

            <Field label="Lot Size">
              <input
                value={lotSize}
                onChange={(event) => setLotSize(event.target.value)}
                type="number"
                step="0.01"
                className="input"
              />
            </Field>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                Auto PnL
              </p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  Number(calculatedPnl || 0) >= 0
                    ? "text-emerald-300"
                    : "text-red-300"
                }`}
              >
                {calculatedPnl === null
                  ? "Open trade"
                  : `$${calculatedPnl.toFixed(2)}`}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                Plan vs Result
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Planned RR:{" "}
                <span className="font-bold text-emerald-300">
                  {plannedRr === null ? "—" : plannedRr.toFixed(2)}
                </span>
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                Actual RR:{" "}
                <span className="font-bold text-white">
                  {actualRr === null ? "—" : actualRr.toFixed(2)}
                </span>
              </p>
            </div>

            <Field label="Emotion Before Trade">
              <select
                value={emotionBefore}
                onChange={(event) => setEmotionBefore(event.target.value)}
                className="input"
              >
                {emotions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Emotion After Trade">
              <select
                value={emotionAfter}
                onChange={(event) => setEmotionAfter(event.target.value)}
                className="input"
              >
                {emotions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Followed TradeRadar Plan?">
              <select
                value={followedPlan ? "yes" : "no"}
                onChange={(event) =>
                  setFollowedPlan(event.target.value === "yes")
                }
                className="input"
              >
                <option value="yes">YES</option>
                <option value="no">NO</option>
              </select>
            </Field>

            <Field label="Main Mistake">
              <select
                value={mistakeTag}
                onChange={(event) => setMistakeTag(event.target.value)}
                className="input"
              >
                <option value="None">None</option>
                <option value="Entered Late">Entered Late</option>
                <option value="Exited Early">Exited Early</option>
                <option value="Moved Stop Loss">Moved Stop Loss</option>
                <option value="Ignored Signal">Ignored Signal</option>
                <option value="Overtraded">Overtraded</option>
                <option value="Revenge Trade">Revenge Trade</option>
              </select>
            </Field>

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="What happened?"
                className="input"
              />
            </Field>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60 md:col-span-2"
            >
              {saving ? "Saving..." : "Save Trade"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Recent Trades
          </p>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="text-sm text-zinc-400">Loading journal...</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No trades logged yet. Add your first trade above.
              </p>
            ) : (
              entries.map((entry) => {
                const savedDiscipline = extractDiscipline(entry.notes);

                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-zinc-800 bg-black/40 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">
                            {entry.asset} · {entry.direction}
                          </p>

                          {savedDiscipline !== null ? (
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getDisciplineClass(
                                savedDiscipline
                              )}`}
                            >
                              {savedDiscipline}/100 Discipline
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                          Entry: {entry.entry_price} · Exit:{" "}
                          {entry.exit_price ?? "Open"} · Lot:{" "}
                          {entry.lot_size ?? "—"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            Number(entry.pnl_amount || 0) >= 0
                              ? "text-emerald-300"
                              : "text-red-300"
                          }`}
                        >
                          {entry.pnl_amount === null
                            ? "Open"
                            : `$${Number(entry.pnl_amount).toFixed(2)}`}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(entry.opened_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {entry.notes ? (
                      <p className="mt-3 whitespace-pre-line text-sm text-zinc-400">
                        {entry.notes}
                      </p>
                    ) : null}

                    {entry.emotion ? (
                      <p className="mt-2 text-xs text-zinc-500">
                        Emotion: {entry.emotion}
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-semibold ${color || "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}