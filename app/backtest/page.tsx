"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";

type EquityPoint = {
  time: string;
  balance: number;
};

type AssetBreakdown = {
  asset: string;
  trades: number;
  return: number;
};

type BacktestStats = {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalReturn: number;
  avgReturn: number;
  expectancy: number;
  maxDrawdown: number;
  bestAsset: string;
  worstAsset: string;
  equityCurve: EquityPoint[];
  assetBreakdown: AssetBreakdown[];
};

type BacktestApiResponse = {
  ok: boolean;
  generatedAt: string;
  backtest: BacktestStats;
};

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function BacktestPage() {
  const [data, setData] = useState<BacktestApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBacktest() {
      setLoading(true);

      const response = await fetch("/api/backtest", {
        cache: "no-store",
      });

      if (response.ok) {
        setData((await response.json()) as BacktestApiResponse);
      }

      setLoading(false);
    }

    loadBacktest();
  }, []);

  const equityStats = useMemo(() => {
    const curve = data?.backtest.equityCurve || [];

    if (curve.length === 0) {
      return {
        minBalance: 0,
        maxBalance: 0,
        path: "",
        areaPath: "",
        points: [],
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

    const areaPath = `${path} L ${last.x} ${height - padding} L ${first.x} ${
      height - padding
    } Z`;

    return {
      minBalance,
      maxBalance,
      path,
      areaPath,
      points,
    };
  }, [data]);

  const backtest = data?.backtest;

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),linear-gradient(135deg,rgba(24,24,27,0.96),rgba(6,6,8,0.99))] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            TradeRadar Backtest Engine
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">
            Prove the edge.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
            Backtest completed TradeRadar signals only. This separates system
            performance from manual trader behavior.
          </p>

          {data?.generatedAt ? (
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-zinc-500">
              Updated {new Date(data.generatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>

        {loading || !backtest ? (
          <p className="text-sm text-zinc-400">Loading backtest...</p>
        ) : (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Closed Trades" value={backtest.totalTrades} />
              <StatCard
                label="Win Rate"
                value={formatPercent(backtest.winRate)}
                color={
                  backtest.winRate >= 50 ? "text-emerald-300" : "text-red-300"
                }
              />
              <StatCard
                label="Total Return"
                value={formatPercent(backtest.totalReturn)}
                color={
                  backtest.totalReturn >= 0
                    ? "text-emerald-300"
                    : "text-red-300"
                }
              />
              <StatCard
                label="Expectancy"
                value={formatPercent(backtest.expectancy)}
                color={
                  backtest.expectancy >= 0 ? "text-emerald-300" : "text-red-300"
                }
              />
              <StatCard
                label="Avg Return"
                value={formatPercent(backtest.avgReturn)}
                color={
                  backtest.avgReturn >= 0 ? "text-emerald-300" : "text-red-300"
                }
              />
              <StatCard
                label="Max Drawdown"
                value={formatPercent(backtest.maxDrawdown)}
                color="text-red-300"
              />
              <StatCard label="Best Asset" value={backtest.bestAsset} />
              <StatCard label="Worst Asset" value={backtest.worstAsset} />
            </div>

            <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    Equity Curve
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    System-only account growth
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Uses only closed TradeRadar signals. Open trades are ignored
                    until they hit TP or SL.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-right">
                  <MiniMetric
                    label="Wins"
                    value={String(backtest.wins)}
                    color="text-emerald-300"
                  />
                  <MiniMetric
                    label="Losses"
                    value={String(backtest.losses)}
                    color="text-red-300"
                  />
                  <MiniMetric
                    label="Trades"
                    value={String(backtest.totalTrades)}
                  />
                </div>
              </div>

              {backtest.equityCurve.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-zinc-800 bg-black/30 p-8">
                  <p className="text-sm text-zinc-500">
                    No closed signals yet. Backtest will populate once signals
                    hit TP or SL.
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
                    aria-label="Backtest equity curve"
                  >
                    <defs>
                      <linearGradient
                        id="backtestEquityFill"
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

                    <path
                      d={equityStats.areaPath}
                      fill="url(#backtestEquityFill)"
                    />

                    <path
                      d={equityStats.path}
                      fill="none"
                      stroke={
                        backtest.totalReturn >= 0
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

            <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Asset Breakdown
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Which assets actually perform?
              </h2>

              {backtest.assetBreakdown.length === 0 ? (
                <p className="mt-6 text-sm text-zinc-500">
                  No closed trades available for asset breakdown yet.
                </p>
              ) : (
                <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-900 text-xs uppercase tracking-[0.16em] text-zinc-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Asset</th>
                        <th className="px-4 py-3 text-left">Trades</th>
                        <th className="px-4 py-3 text-left">Return</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800">
                      {backtest.assetBreakdown.map((item) => (
                        <tr key={item.asset} className="bg-black/30">
                          <td className="px-4 py-3 font-semibold text-white">
                            {item.asset}
                          </td>
                          <td className="px-4 py-3 text-zinc-300">
                            {item.trades}
                          </td>
                          <td
                            className={`px-4 py-3 font-bold ${
                              item.return >= 0
                                ? "text-emerald-300"
                                : "text-red-300"
                            }`}
                          >
                            {formatPercent(item.return)}
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

function MiniMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-black ${color || "text-white"}`}>
        {value}
      </p>
    </div>
  );
}