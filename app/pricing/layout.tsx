import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — R299/month",
  description:
    "Start with a 7-day free trial — no card needed. Full access to live signals, trade plans, and risk tools. R299/month after the trial. Cancel anytime.",
  alternates: { canonical: "https://traderadar.co.za/pricing" },
  openGraph: {
    title: "TradeRadar Pricing — R299/month",
    description:
      "7-day free trial, no card required. Full signal access from R299/month.",
    url: "https://traderadar.co.za/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
