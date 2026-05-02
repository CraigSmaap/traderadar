"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";

type MonthlyPerformance = {
  month: string;
  return: number;
};

type DailyPerformance = {
  date: string;
  return: number;
};

type EquityPoint = {
  time: string;
  balance: number;
};

type PerformanceData = {
  total?: number;
  won?: number;
  lost?: number;
  pending?: number;
  wins?: number;
  losses?: number;
  winRate: number;
  totalReturn: number;
  startBalance?: number;
  endBalance?: number;
  maxDrawdown?: number;
  monthly: MonthlyPerformance[];
  daily?: DailyPerformance[];
  equityCurve?: EquityPoint[];
};

function getCurrentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function getCurrentDate() {
  const date = new Date();
  return date.toISOString().split("T")[0];
}

function formatMoney(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `$${value.toFixed(2)}`;
}

function formatPercent(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0.00%";
  return `${value.toFixed(2)}%`;
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());

  useEffect(() => {
    async function loadPerformance() {
      const response = await fetch("/api/performance", {
        method: "GET",
        cache: "no-store",
      });

      const json = (await response.json()) as PerformanceData;
      setData(json);
    }

    loadPerformance();
  }, []);

  const selectedMonthData = useMemo(() => {
    if (!data) return null;
    return data.monthly.find((item) => item.month === selectedMonth) || null;
  }, [data, selectedMonth]);

  const selectedDateData = useMemo(() => {
    if (!data?.daily) return null;
    return data.daily.find((item) => item.date === selectedDate) || null;
  }, [data, selectedDate]);

  const availableMonths = useMemo(() => {
    if (!data) return [];
    return data.monthly.map((item) => item.month);
  }, [data]);

  const equityStats = useMemo(() => {
    const curve = data?.equityCurve || [];

    if (curve.length === 0) {
      return {
        points: [],
        minBalance: 0,
        maxBalance: 0,
        path: "",
        areaPath: "",
      };
    }

    const minBalance = Math.min(...curve.map((point) => point.balance));
    const maxBalance = Math.max(...curve.map((point) => point.balance));
    const range = maxBalance - minBalance || 1;

    const width = 1000;
    const height = 280;
    const padding = 24;

    const points = curve.map((point, index) => {
      const x =
        curve.length === 1
          ? width / 2
          : padding + (index / (curve.length - 1)) * (width - padding * 2);

      const y =
        height -
        padding -
        ((point.balance - minBalance) / range) * (height - padding * 2);

      return {
        ...point,
        x,
        y,
      };
    });

    const path = points
      .map((point, index) =>
        index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
      )
      .join(" ");

    const first = points[0];
    const last = points[points.length - 1];

    const areaPath =
      points.length === 0
        ? ""
        : `${path} L ${last.x} ${height - padding} L ${first.x} ${
            height - padding
          } Z`;

    return {
      points,
      minBalance,
      maxBalance,
      path,
      areaPath,
    };
  }, [data]);

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),#09090b] p-6 shadow-2xl shadow-emerald-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Trade Radar Proof Engine
          </p>

          <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">
            Performance
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Track signal quality, account growth, drawdown, win rate, and
            monthly consistency.
          </p>
        </div>

        {!data ? (
          <p className="mt-8 text-zinc-500">Loading performance...</p>
        ) : (
          <>
            <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-xl font-black text-white">Filter results</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Select date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Select month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    {availableMonths.length === 0 ? (
                      <option value={selectedMonth}>{selectedMonth}</option>
                    ) : (
                      availableMonths.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </section>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <StatCard
                label="Start Balance"
                value={formatMoney(data.startBalance)}
              />
              <StatCard
                label="End Balance"
                value={formatMoney(data.endBalance)}
              />
              <StatCard
                label="Wins"
                value={data.wins ?? data.won ?? 0}
                color="text-emerald-300"
              />
              <StatCard
                label="Losses"
                value={data.losses ?? data.lost ?? 0}
                color="text-red-300"
              />
              <StatCard
                label="Win Rate"
                value={formatPercent(data.winRate)}
                color={
                  data.winRate >= 50 ? "text-emerald-300" : "text-yellow-300"
                }
              />
              <StatCard
                label="Total Return"
                value={formatPercent(data.totalReturn)}
                color={
                  data.totalReturn >= 0 ? "text-emerald-300" : "text-red-300"
                }
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Max Drawdown"
                value={formatPercent(data.maxDrawdown ?? 0)}
                color="text-red-300"
              />
              <StatCard
                label="Pending"
                value={data.pending ?? 0}
                color="text-yellow-300"
              />
              <StatCard label="Total Signals" value={data.total ?? "—"} />
            </div>

            <section className="mt-10 grid gap-4 md:grid-cols-2">
              <SummaryCard
                title="Selected Day"
                label={selectedDate}
                value={
                  selectedDateData
                    ? formatPercent(selectedDateData.return)
                    : "No data"
                }
                positive={(selectedDateData?.return || 0) >= 0}
              />

              <SummaryCard
                title="Selected Month"
                label={selectedMonth}
                value={
                  selectedMonthData
                    ? formatPercent(selectedMonthData.return)
                    : "No data"
                }
                positive={(selectedMonthData?.return || 0) >= 0}
              />
            </section>

            <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Equity Curve
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    Account Journey
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    Risk-based simulated growth from closed TradeRadar signals.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-right">
                  <MiniMetric
                    label="Growth"
                    value={formatPercent(data.totalReturn)}
                  />
                  <MiniMetric
                    label="Drawdown"
                    value={formatPercent(data.maxDrawdown ?? 0)}
                  />
                  <MiniMetric
                    label="Closed"
                    value={`${(data.wins ?? 0) + (data.losses ?? 0)}`}
                  />
                </div>
              </div>

              {!data.equityCurve || data.equityCurve.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-zinc-800 bg-black/30 p-8">
                  <p className="text-sm text-zinc-500">
                    No closed trades available for the equity curve yet.
                  </p>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-zinc-800 bg-black p-5">
                  <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
                    <span>{formatMoney(equityStats.minBalance)}</span>
                    <span>{formatMoney(equityStats.maxBalance)}</span>
                  </div>

                  <svg
                    viewBox="0 0 1000 280"
                    className="h-72 w-full overflow-visible"
                    role="img"
                    aria-label="Equity curve chart"
                  >
                    <defs>
                      <linearGradient
                        id="equityFill"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="rgb(52 211 153)"
                          stopOpacity="0.28"
                        />
                        <stop
                          offset="100%"
                          stopColor="rgb(52 211 153)"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    <line
                      x1="24"
                      y1="256"
                      x2="976"
                      y2="256"
                      stroke="rgb(39 39 42)"
                      strokeWidth="2"
                    />

                    <path d={equityStats.areaPath} fill="url(#equityFill)" />

                    <path
                      d={equityStats.path}
                      fill="none"
                      stroke={
                        data.totalReturn >= 0
                          ? "rgb(52 211 153)"
                          : "rgb(248 113 113)"
                      }
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {equityStats.points.map((point, index) => (
                      <circle
                        key={`${point.time}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={index === equityStats.points.length - 1 ? 7 : 4}
                        fill="rgb(52 211 153)"
                      >
                        <title>
                          {`${new Date(
                            point.time
                          ).toLocaleDateString()} - ${formatMoney(
                            point.balance
                          )}`}
                        </title>
                      </circle>
                    ))}
                  </svg>
                </div>
              )}
            </section>

            <section className="mt-10 grid gap-6 lg:grid-cols-2">
              <PerformanceTable
                title="Monthly Performance"
                subtitle="Return by month"
                emptyText="No monthly performance data yet."
                rows={data.monthly.map((item) => ({
                  label: item.month,
                  value: item.return,
                }))}
              />

              <PerformanceTable
                title="Daily Performance"
                subtitle="Return by day"
                emptyText="No daily performance data yet."
                rows={(data.daily || []).map((item) => ({
                  label: item.date,
                  value: item.return,
                }))}
              />
            </section>
          </>
        )}
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black ${color || "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  title,
  label,
  value,
  positive,
}: {
  title: string;
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {title}
      </p>
      <p className="mt-2 text-sm text-zinc-400">{label}</p>
      <p
        className={`mt-3 text-3xl font-black ${
          positive ? "text-emerald-300" : "text-red-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function PerformanceTable({
  title,
  subtitle,
  emptyText,
  rows,
}: {
  title: string;
  subtitle: string;
  emptyText: string;
  rows: { label: string; value: number }[];
}) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
        {title}
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">{subtitle}</h2>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">{emptyText}</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-xs uppercase tracking-[0.16em] text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-left">Return</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800">
              {rows.map((item) => (
                <tr key={item.label} className="bg-black/30">
                  <td className="px-4 py-3 font-semibold text-white">
                    {item.label}
                  </td>
                  <td
                    className={`px-4 py-3 font-bold ${
                      item.value >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {formatPercent(item.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}