import Header from "@/components/layout/Header";

type StockInsight = {
  symbol: string;
  name: string;
  sector: string;
  region: string;
  badge: string;
  accent: string;
  risk: "Low" | "Medium" | "High";
  view: "Watch" | "Research" | "Momentum Watch" | "High Risk";
};

const exnessStocks: StockInsight[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", region: "USA", badge: "A", accent: "bg-zinc-100 text-black", risk: "Medium", view: "Watch" },
  { symbol: "ABBV", name: "AbbVie Inc.", sector: "Healthcare", region: "USA", badge: "AB", accent: "bg-blue-950 text-blue-100", risk: "Medium", view: "Research" },
  { symbol: "ABT", name: "Abbott Laboratories", sector: "Healthcare", region: "USA", badge: "AT", accent: "bg-sky-500 text-white", risk: "Medium", view: "Research" },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Software", region: "USA", badge: "AD", accent: "bg-red-600 text-white", risk: "Medium", view: "Watch" },
  { symbol: "ADP", name: "Automatic Data Processing, Inc.", sector: "Business Services", region: "USA", badge: "AP", accent: "bg-red-500 text-white", risk: "Low", view: "Research" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", sector: "Semiconductors", region: "USA", badge: "AI", accent: "bg-zinc-950 text-white", risk: "High", view: "Momentum Watch" },
  { symbol: "AMGN", name: "Amgen Inc.", sector: "Biotech", region: "USA", badge: "AM", accent: "bg-blue-600 text-white", risk: "Medium", view: "Research" },
  { symbol: "VIPS", name: "Vipshop Holdings Ltd", sector: "E-Commerce", region: "China", badge: "VIP", accent: "bg-pink-600 text-white", risk: "High", view: "High Risk" },
  { symbol: "TAL", name: "TAL Education Group", sector: "Education", region: "China", badge: "T", accent: "bg-sky-700 text-white", risk: "High", view: "High Risk" },
  { symbol: "PDD", name: "Pinduoduo Inc.", sector: "E-Commerce", region: "China", badge: "PD", accent: "bg-red-600 text-white", risk: "High", view: "Momentum Watch" },
  { symbol: "NIO", name: "NIO Limited", sector: "EV", region: "China", badge: "EV", accent: "bg-black text-white", risk: "High", view: "High Risk" },
  { symbol: "LI", name: "Li Auto Inc.", sector: "EV", region: "China", badge: "LI", accent: "bg-blue-800 text-white", risk: "High", view: "High Risk" },
  { symbol: "BILI", name: "Bilibili Inc", sector: "Media", region: "China", badge: "BI", accent: "bg-sky-500 text-white", risk: "High", view: "High Risk" },
  { symbol: "TME", name: "Tencent Music Entertainment Group", sector: "Media", region: "China", badge: "TM", accent: "bg-blue-500 text-white", risk: "High", view: "Research" },
  { symbol: "BIDU", name: "Baidu, Inc.", sector: "AI / Search", region: "China", badge: "BD", accent: "bg-indigo-600 text-white", risk: "High", view: "Momentum Watch" },
  { symbol: "EDU", name: "New Oriental Education & Technology", sector: "Education", region: "China", badge: "ED", accent: "bg-emerald-700 text-white", risk: "High", view: "High Risk" },
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy", region: "USA", badge: "XO", accent: "bg-red-600 text-white", risk: "Medium", view: "Watch" },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer Defensive", region: "USA", badge: "WM", accent: "bg-yellow-400 text-black", risk: "Low", view: "Research" },
  { symbol: "VZ", name: "Verizon Communications Inc.", sector: "Telecoms", region: "USA", badge: "VZ", accent: "bg-black text-white", risk: "Low", view: "Research" },
  { symbol: "VRTX", name: "Vertex Pharmaceuticals Incorporated", sector: "Biotech", region: "USA", badge: "VX", accent: "bg-purple-800 text-white", risk: "Medium", view: "Research" },
  { symbol: "V", name: "Visa Inc.", sector: "Payments", region: "USA", badge: "V", accent: "bg-blue-700 text-white", risk: "Low", view: "Watch" },
  { symbol: "UNH", name: "UnitedHealth Group Incorporated", sector: "Healthcare", region: "USA", badge: "UH", accent: "bg-blue-950 text-white", risk: "Medium", view: "Research" },
  { symbol: "T", name: "AT&T Inc.", sector: "Telecoms", region: "USA", badge: "T", accent: "bg-sky-500 text-white", risk: "Low", view: "Research" },
  { symbol: "PG", name: "Procter & Gamble Company", sector: "Consumer Defensive", region: "USA", badge: "PG", accent: "bg-blue-700 text-white", risk: "Low", view: "Research" },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "AI / Semiconductors", region: "USA", badge: "AI", accent: "bg-lime-500 text-black", risk: "High", view: "Momentum Watch" },
  { symbol: "NKE", name: "Nike, Inc.", sector: "Consumer Cyclical", region: "USA", badge: "NK", accent: "bg-black text-white", risk: "Medium", view: "Research" },
  { symbol: "BEKE", name: "KE Holdings Inc", sector: "Real Estate", region: "China", badge: "BK", accent: "bg-blue-500 text-white", risk: "High", view: "High Risk" },
  { symbol: "REGN", name: "Regeneron Pharmaceuticals, Inc.", sector: "Biotech", region: "USA", badge: "RG", accent: "bg-blue-700 text-white", risk: "Medium", view: "Research" },
  { symbol: "MS", name: "Morgan Stanley", sector: "Financials", region: "USA", badge: "MS", accent: "bg-black text-white", risk: "Medium", view: "Watch" },
  { symbol: "MRK", name: "Merck & Company, Inc.", sector: "Healthcare", region: "USA", badge: "MK", accent: "bg-teal-700 text-white", risk: "Medium", view: "Research" },
  { symbol: "MMM", name: "3M Company", sector: "Industrials", region: "USA", badge: "3M", accent: "bg-red-600 text-white", risk: "Medium", view: "Research" },
  { symbol: "MDLZ", name: "Mondelez International, Inc.", sector: "Consumer Defensive", region: "USA", badge: "MZ", accent: "bg-purple-800 text-white", risk: "Low", view: "Research" },
  { symbol: "MA", name: "Mastercard Incorporated", sector: "Payments", region: "USA", badge: "MA", accent: "bg-black text-white", risk: "Low", view: "Watch" },
  { symbol: "LLY", name: "Eli Lilly and Company", sector: "Healthcare", region: "USA", badge: "LY", accent: "bg-red-600 text-white", risk: "Medium", view: "Momentum Watch" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", region: "USA", badge: "JJ", accent: "bg-red-600 text-white", risk: "Low", view: "Research" },
  { symbol: "GILD", name: "Gilead Sciences, Inc.", sector: "Biotech", region: "USA", badge: "GD", accent: "bg-rose-700 text-white", risk: "Medium", view: "Research" },
  { symbol: "META", name: "Meta Platforms, Inc.", sector: "Technology", region: "USA", badge: "M", accent: "bg-blue-600 text-white", risk: "Medium", view: "Watch" },
  { symbol: "F", name: "Ford Motor Company", sector: "Automotive", region: "USA", badge: "F", accent: "bg-blue-900 text-white", risk: "Medium", view: "Research" },
  { symbol: "EQIX", name: "Equinix, Inc.", sector: "Data Centers", region: "USA", badge: "EQ", accent: "bg-black text-red-400", risk: "Medium", view: "Watch" },
  { symbol: "EBAY", name: "eBay Inc.", sector: "E-Commerce", region: "USA", badge: "EB", accent: "bg-zinc-100 text-zinc-900", risk: "Medium", view: "Research" },
  { symbol: "EA", name: "Electronic Arts Inc.", sector: "Gaming", region: "USA", badge: "EA", accent: "bg-red-500 text-white", risk: "Medium", view: "Research" },
  { symbol: "CSX", name: "CSX Corporation", sector: "Transport", region: "USA", badge: "CX", accent: "bg-blue-700 text-white", risk: "Medium", view: "Research" },
  { symbol: "CSCO", name: "Cisco Systems, Inc.", sector: "Networking", region: "USA", badge: "CS", accent: "bg-cyan-500 text-white", risk: "Low", view: "Research" },
  { symbol: "PFE", name: "Pfizer, Inc.", sector: "Healthcare", region: "USA", badge: "PF", accent: "bg-indigo-700 text-white", risk: "Medium", view: "Research" },
  { symbol: "CME", name: "CME Group Inc.", sector: "Financial Exchange", region: "USA", badge: "CM", accent: "bg-sky-700 text-white", risk: "Low", view: "Research" },
  { symbol: "C", name: "Citigroup Inc.", sector: "Financials", region: "USA", badge: "C", accent: "bg-blue-900 text-white", risk: "Medium", view: "Research" },
  { symbol: "BMY", name: "Bristol-Myers Squibb Company", sector: "Healthcare", region: "USA", badge: "BM", accent: "bg-purple-700 text-white", risk: "Medium", view: "Research" },
  { symbol: "BIIB", name: "Biogen Inc.", sector: "Biotech", region: "USA", badge: "BG", accent: "bg-zinc-200 text-zinc-900", risk: "High", view: "Research" },
  { symbol: "BA", name: "Boeing Company", sector: "Aerospace", region: "USA", badge: "BA", accent: "bg-blue-800 text-white", risk: "High", view: "High Risk" },
  { symbol: "ATVI", name: "Activision Blizzard, Inc.", sector: "Gaming", region: "USA", badge: "AB", accent: "bg-black text-white", risk: "High", view: "Research" },
  { symbol: "TMUS", name: "T-Mobile US, Inc.", sector: "Telecoms", region: "USA", badge: "TM", accent: "bg-pink-600 text-white", risk: "Medium", view: "Research" },
  { symbol: "SBUX", name: "Starbucks Corporation", sector: "Consumer Cyclical", region: "USA", badge: "SB", accent: "bg-emerald-700 text-white", risk: "Medium", view: "Research" },
  { symbol: "CVS", name: "CVS Health Corporation", sector: "Healthcare", region: "USA", badge: "CV", accent: "bg-red-600 text-white", risk: "Medium", view: "Research" },
  { symbol: "XPEV", name: "XPeng Inc.", sector: "EV", region: "China", badge: "XP", accent: "bg-black text-white", risk: "High", view: "High Risk" },
  { symbol: "LMT", name: "Lockheed Martin Corporation", sector: "Defense", region: "USA", badge: "LM", accent: "bg-blue-950 text-white", risk: "Medium", view: "Research" },
  { symbol: "NFLX", name: "Netflix, Inc.", sector: "Streaming", region: "USA", badge: "N", accent: "bg-black text-red-500", risk: "Medium", view: "Watch" },
  { symbol: "MCD", name: "McDonalds Corporation", sector: "Consumer Defensive", region: "USA", badge: "MC", accent: "bg-yellow-400 text-red-700", risk: "Low", view: "Research" },
  { symbol: "PEP", name: "PepsiCo, Inc.", sector: "Consumer Defensive", region: "USA", badge: "PP", accent: "bg-blue-700 text-white", risk: "Low", view: "Research" },
  { symbol: "FB", name: "Facebook, Inc.", sector: "Technology", region: "USA", badge: "FB", accent: "bg-blue-500 text-white", risk: "Medium", view: "Watch" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "EV", region: "USA", badge: "T", accent: "bg-red-600 text-white", risk: "High", view: "Momentum Watch" },
  { symbol: "ZTO", name: "ZTO Express Inc.", sector: "Logistics", region: "China", badge: "ZT", accent: "bg-blue-500 text-white", risk: "High", view: "Research" },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Semiconductors", region: "USA", badge: "AV", accent: "bg-rose-600 text-white", risk: "Medium", view: "Momentum Watch" },
  { symbol: "MO", name: "Altria Group, Inc.", sector: "Consumer Defensive", region: "USA", badge: "MO", accent: "bg-zinc-700 text-white", risk: "Medium", view: "Research" },
  { symbol: "AMT", name: "American Tower Corporation", sector: "REIT / Towers", region: "USA", badge: "AT", accent: "bg-black text-white", risk: "Medium", view: "Research" },
  { symbol: "ORCL", name: "Oracle Corporation", sector: "Software", region: "USA", badge: "OR", accent: "bg-red-600 text-white", risk: "Medium", view: "Watch" },
  { symbol: "INTC", name: "Intel Corporation", sector: "Semiconductors", region: "USA", badge: "IN", accent: "bg-blue-600 text-white", risk: "High", view: "Momentum Watch" },
];

function getRiskStyles(risk: StockInsight["risk"]) {
  if (risk === "Low") return "text-emerald-300";
  if (risk === "Medium") return "text-yellow-300";
  return "text-red-300";
}

function getViewStyles(view: StockInsight["view"]) {
  if (view === "Watch") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (view === "Momentum Watch") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (view === "High Risk") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

export default function StocksPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_32%),linear-gradient(135deg,rgba(24,24,27,0.96)_0%,rgba(6,6,8,0.99)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
            Exness Stocks · Research Only
          </div>

          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Stocks Watchlist
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 sm:text-base">
            This page tracks Exness-available stocks for long-term research,
            news themes, and watchlist building only. It does not create trade
            signals and does not affect performance, backtest, or signal history.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Stocks Listed
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {exnessStocks.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Signal Engine
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                Isolated
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Execution
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-200">
                Manual Research
              </p>
            </div>
          </div>
        </div>

        <section className="mb-8 rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">
            Separation Rule
          </p>

          <h2 className="mt-3 text-2xl font-black text-white">
            Stocks must stay outside the trading signal engine.
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-400">
            This page must not call /api/market, must not write to Supabase
            signal_results, must not write to signal_history, and must not feed
            the performance or backtest engine.
          </p>
        </section>

        <section>
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                Exness Stock Universe
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Research cards
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-6 text-zinc-400">
              Icons are safe internal badges, not copied brand logos. Real logos
              can be added later only through a licensed source.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {exnessStocks.map((stock) => (
              <article
                key={stock.symbol}
                className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-blue-500/30 hover:bg-zinc-900/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black ${stock.accent}`}
                    >
                      {stock.badge}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-xl font-black text-white">
                          {stock.symbol}
                        </h3>

                        <span className="text-sm font-black text-red-500">
                          ▌▌▌
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-zinc-400">
                        {stock.name}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getViewStyles(
                      stock.view
                    )}`}
                  >
                    {stock.view}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-zinc-800 bg-black/30 p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Sector
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {stock.sector}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-black/30 p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Region
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {stock.region}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-black/30 p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Risk
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${getRiskStyles(
                        stock.risk
                      )}`}
                    >
                      {stock.risk}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Insight status
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Placeholder insight card. Future upgrade can add earnings,
                    news, valuation notes, analyst summary, and long-term trend
                    context.
                  </p>
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-5 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-zinc-500"
                >
                  View insight coming soon
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}