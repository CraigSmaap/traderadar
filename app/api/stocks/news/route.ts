import { NextResponse } from "next/server";

export type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: number;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ news: [] });
  }

  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${symbol}&quotesCount=0&newsCount=5&enableFuzzyQuery=false`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
      },
    );

    if (!res.ok) return NextResponse.json({ news: [] });

    const json = await res.json();
    const raw: Record<string, unknown>[] = json?.news ?? [];

    const news: NewsItem[] = raw.slice(0, 5).map((item) => ({
      title: String(item.title ?? ""),
      link: String(item.link ?? ""),
      publisher: String(item.publisher ?? ""),
      publishedAt: Number(item.providerPublishTime ?? 0),
    }));

    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({ news: [] });
  }
}
