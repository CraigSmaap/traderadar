import { NextResponse } from "next/server";

export type StockQuote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

const BATCH_SIZE = 50;

async function fetchBatch(symbols: string[]): Promise<StockQuote[]> {
  const joined = symbols.join(",");
  const res = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${joined}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    },
  );
  if (!res.ok) return [];

  const json = await res.json();
  const results = json?.quoteResponse?.result ?? [];

  return results
    .filter((r: Record<string, unknown>) => Number.isFinite(Number(r.regularMarketPrice)))
    .map((r: Record<string, unknown>) => ({
      symbol: String(r.symbol),
      price: Number(r.regularMarketPrice),
      change: Number(r.regularMarketChange ?? 0),
      changePercent: Number(r.regularMarketChangePercent ?? 0),
    }));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawSymbols = searchParams.get("symbols") ?? "";
  const symbols = rawSymbols.split(",").map((s) => s.trim()).filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  // Batch to stay within URL length limits
  const batches: string[][] = [];
  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    batches.push(symbols.slice(i, i + BATCH_SIZE));
  }

  const results = (await Promise.all(batches.map(fetchBatch))).flat();
  return NextResponse.json({ quotes: results });
}
