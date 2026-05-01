"use client";

import { useEffect, useMemo, useState } from "react";

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

  const maxBalance = useMemo(() => {
    if (!data?.equityCurve || data.equityCurve.length === 0) return 0;
    return Math.max(...data.equityCurve.map((point) => point.balance));
  }, [data]);

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Trade Radar Proof Engine
          </p>

          <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
            Performance
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Filter Trade Radar prediction results by day or month.
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
              <StatCard label="Start Balance" value={formatMoney(data.startBalance)} />
              <StatCard label="End Balance" value={formatMoney(data.endBalance)} />
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
                value={`${data.winRate.toFixed(2)}%`}
                color={
                  data.winRate >= 50 ? "text-emerald-300" : "text-yellow-300"
                }
              />
              <StatCard
                label="Total Return"
                value={`${data.totalReturn.toFixed(2)}%`}
                color={
                  data.totalReturn >= 0 ? "text-emerald-300" : "text-red-300"
                }
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Max Drawdown"
                value={`${(data.maxDrawdown ?? 0).toFixed(2)}%`}
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
                    ? `${selectedDateData.return.toFixed(2)}%`
                    : "No data"
                }
                positive={(selectedDateData?.return || 0) >= 0}
              />

              <SummaryCard
                title="Selected Month"
                label={selectedMonth}
                value={
                  selectedMonthData
                    ? `${selectedMonthData.return.toFixed(2)}%`
                    : "No data"
                }
                positive={(selectedMonthData?.return || 0) >= 0}
              />
            </section>

            <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Equity Curve
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Simulated account growth
              </h2>

              {!data.equityCurve || data.equityCurve.length === 0 ? (
                <p className="mt-6 text-sm text-zinc-500">
                  No closed trades available for equity curve yet.
                </p>
              ) : (
                <div className="mt-6 h-64 rounded-2xl border border-zinc-800 bg-black/30 p-4">
                  <div className="flex h-full items-end gap-1">
                    {data.equityCurve.map((point, index) => {
                      const height =
                        maxBalance === 0 ? 0 : (point.balance / maxBalance) * 100;

                      return (
                        <div
                          key={`${point.time}-${index}`}
                          className="min-h-[4px] flex-1 rounded-t bg-emerald-400"
                          style={{ height: `${height}%` }}
                          title={`${new Date(point.time).toLocaleDateString()} - ${formatMoney(
                            point.balance
                          )}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Monthly Performance
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Return by month
              </h2>

              <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 text-xs uppercase tracking-[0.16em] text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Month</th>
                      <th className="px-4 py-3 text-left">Return</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-800">
                    {data.monthly.map((item) => (
                      <tr key={item.month} className="bg-black/30">
                        <td className="px-4 py-3 font-semibold text-white">
                          {item.month}
                        </td>
                        <td
                          className={`px-4 py-3 font-bold ${
                            item.return >= 0 ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {item.return.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Daily Performance
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Return by day
              </h2>

              {!data.daily || data.daily.length === 0 ? (
                <p className="mt-6 text-sm text-zinc-500">
                  No daily performance data yet.
                </p>
              ) : (
                <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-900 text-xs uppercase tracking-[0.16em] text-zinc-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Return</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800">
                      {data.daily.map((item) => (
                        <tr key={item.date} className="bg-black/30">
                          <td className="px-4 py-3 font-semibold text-white">
                            {item.date}
                          </td>
                          <td
                            className={`px-4 py-3 font-bold ${
                              item.return >= 0
                                ? "text-emerald-300"
                                : "text-red-300"
                            }`}
                          >
                            {item.return.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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