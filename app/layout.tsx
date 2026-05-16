import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/layout/Footer";
import ServiceWorkerRegistrar from "@/components/ui/ServiceWorkerRegistrar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE = "https://traderadar.co.za";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "TradeRadar — Live Forex & Gold Signals for Beginners",
    template: "%s | TradeRadar",
  },
  description:
    "AI-powered BUY/SELL/WAIT trade plans for Exness traders. Clear entry zones, stop loss, and take profit on XAUUSD, EURUSD, GBPUSD and more. No charts required.",
  keywords: [
    "forex signals",
    "gold trading signals",
    "XAUUSD signals",
    "Exness trader",
    "forex for beginners",
    "trade plans South Africa",
    "live trading signals",
    "forex signal service",
  ],
  authors: [{ name: "TradeRadar", url: BASE }],
  creator: "TradeRadar",
  publisher: "TradeRadar",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: BASE,
    siteName: "TradeRadar",
    title: "TradeRadar — Live Forex & Gold Signals for Beginners",
    description:
      "Clear BUY/SELL/WAIT trade plans for Exness traders. No charts required. 7-day free trial.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeRadar — Live Forex & Gold Signals for Beginners",
    description: "Clear BUY/SELL/WAIT trade plans. No charts required.",
    site: "@traderadar",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TradeRadar",
  },
  other: { "mobile-web-app-capable": "yes" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#000000" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "TradeRadar",
                url: "https://traderadar.co.za",
                logo: "https://traderadar.co.za/icon-512x512.png",
                description:
                  "AI-powered forex and gold trade signal service for Exness traders.",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "TradeRadar",
                url: "https://traderadar.co.za",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://traderadar.co.za/live",
                },
              },
            ]),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-black text-white">
        <ServiceWorkerRegistrar />

        <div className="flex-1">
          {children}
        </div>

        <Footer />
      </body>
    </html>
  );
}
