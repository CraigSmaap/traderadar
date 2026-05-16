import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "TradeRadar terms of service — rules and conditions for using the platform.",
  alternates: { canonical: "https://traderadar.co.za/terms" },
  robots: { index: false, follow: false },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
