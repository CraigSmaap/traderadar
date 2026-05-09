import { NextResponse } from "next/server";

export type StockQuote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

async function fetchQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" },
    );
    if (!res.ok) return null;

    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    const price = Number(meta?.regularMarketPrice);
    const prevClose = Number(
      meta?.chartPreviousClose ??
      meta?.regularMarketPreviousClose ??
      meta?.previousClose,
    );

    if (!Number.isFinite(price) || !Number.isFinite(prevClose) || prevClose <= 0) return null;

    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;
    return { symbol, price, change, changePercent };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawSymbols = searchParams.get("symbols") ?? "";
  const symbols = rawSymbols.split(",").map((s) => s.trim()).filter(Boolean);

  if (symbols.length === 0) return NextResponse.json({ quotes: [] });

  // Fetch in batches of 10 concurrently to avoid rate limiting
  const BATCH = 10;
  const quotes: StockQuote[] = [];

  for (let i = 0; i < symbols.length; i += BATCH) {
    const batch = symbols.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(fetchQuote));
    for (const q of results) if (q) quotes.push(q);
    if (i + BATCH < symbols.length) await new Promise((r) => setTimeout(r, 200));
  }

  return NextResponse.json({ quotes });
}
