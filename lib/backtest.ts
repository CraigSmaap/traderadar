import {
  calculateRiskBasedReturn,
  getDayKey,
  getMonthKey,
  isClosedTrade,
  type SignalResult,
} from "@/lib/analytics";

export type BacktestStats = {
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

  equityCurve: { time: string; balance: number }[];

  assetBreakdown: {
    asset: string;
    trades: number;
    return: number;
  }[];
};

const START_BALANCE = 100;

export function runBacktest(rows: SignalResult[]): BacktestStats {
  const closed = rows.filter((r) => isClosedTrade(r.status));

  let balance = START_BALANCE;
  let peak = START_BALANCE;
  let maxDrawdown = 0;

  let wins = 0;
  let losses = 0;

  const equityCurve: { time: string; balance: number }[] = [];

  const assetMap: Record<
    string,
    { trades: number; return: number }
  > = {};

  let totalReturnAccum = 0;

  for (const row of closed) {
    const tradeReturn = calculateRiskBasedReturn(row);

    totalReturnAccum += tradeReturn;

    balance = balance * (1 + tradeReturn / 100);

    if (tradeReturn > 0) wins++;
    if (tradeReturn < 0) losses++;

    if (balance > peak) peak = balance;

    const drawdown = ((peak - balance) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;

    equityCurve.push({
      time: row.created_at,
      balance: Number(balance.toFixed(2)),
    });

    const asset = row.asset;

    if (!assetMap[asset]) {
      assetMap[asset] = { trades: 0, return: 0 };
    }

    assetMap[asset].trades += 1;
    assetMap[asset].return += tradeReturn;
  }

  const totalTrades = closed.length;
  const completed = wins + losses;

  const winRate = completed === 0 ? 0 : (wins / completed) * 100;

  const avgReturn =
    totalTrades === 0 ? 0 : totalReturnAccum / totalTrades;

  const lossRate = completed === 0 ? 0 : losses / completed;

  const avgWin =
    wins === 0
      ? 0
      : totalReturnAccum / wins;

  const avgLoss =
    losses === 0
      ? 0
      : totalReturnAccum / losses;

  const expectancy =
    (avgWin * (wins / completed || 0)) -
    (Math.abs(avgLoss) * lossRate);

  const totalReturn =
    ((balance - START_BALANCE) / START_BALANCE) * 100;

  const assetBreakdown = Object.entries(assetMap).map(
    ([asset, data]) => ({
      asset,
      trades: data.trades,
      return: Number(data.return.toFixed(2)),
    })
  );

  const sortedAssets = [...assetBreakdown].sort(
    (a, b) => b.return - a.return
  );

  const bestAsset = sortedAssets[0]?.asset || "—";
  const worstAsset =
    sortedAssets[sortedAssets.length - 1]?.asset || "—";

  return {
    totalTrades,
    wins,
    losses,
    winRate: Number(winRate.toFixed(2)),

    totalReturn: Number(totalReturn.toFixed(2)),
    avgReturn: Number(avgReturn.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),

    maxDrawdown: Number(maxDrawdown.toFixed(2)),

    bestAsset,
    worstAsset,

    equityCurve,
    assetBreakdown,
  };
}