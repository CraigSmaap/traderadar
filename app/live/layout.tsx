import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Trade Signals",
  description:
    "Real-time BUY/SELL signals on XAUUSD, EURUSD, GBPUSD and more. Live entry zones, stop loss, and take profit targets updated every 30 minutes.",
  alternates: { canonical: "https://traderadar.co.za/live" },
  openGraph: {
    title: "Live Trade Signals — TradeRadar",
    description:
      "Real-time forex and gold signals with full trade plans. Entry, SL, TP1, TP2, TP3.",
    url: "https://traderadar.co.za/live",
  },
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
