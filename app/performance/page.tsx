"use client";

import { useEffect, useState } from "react";

type MonthlyPerformance = {
  month: string;
  return: number;
};

type DailyPerformance = {
  date: string;
  return: number;
};

type PerformanceData = {
  total: number;
  won: number;
  lost: number;
  pending: number;
  winRate: number;
  totalReturn: number;
  monthly: MonthlyPerformance[];
  daily: DailyPerformance[];
};

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);

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
            Track how the platform predictions are performing across wins,
            losses, pending trades, daily returns and monthly returns.
          </p>
        </div>

        {!data ? (
          <p className="mt-8 text-zinc-500">Loading performance...</p>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <StatCard label="Total Signals" value={data.total} />
              <StatCard label="Won" value={data.won} color="text-emerald-300" />
              <StatCard label="Lost" value={data.lost} color="text-red-300" />
              <StatCard
                label="Pending"
                value={data.pending}
                color="text-yellow-300"
              />
              <StatCard
                label="Win Rate"
                value={`${data.winRate}%`}
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

            <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Monthly Performance
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    Return by month
                  </h2>
                </div>

                <p className="max-w-xl text-sm leading-6 text-zinc-400">
                  Monthly return is calculated from saved prediction result
                  percentages in Supabase.
                </p>
              </div>

              {data.monthly.length === 0 ? (
                <p className="mt-6 text-sm text-zinc-500">
                  No monthly performance data yet.
                </p>
              ) : (
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

            <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Daily Performance
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    Return by day
                  </h2>
                </div>

                <p className="max-w-xl text-sm leading-6 text-zinc-400">
                  Daily return helps users see how predictions performed on each
                  trading day.
                </p>
              </div>

              {data.daily.length === 0 ? (
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