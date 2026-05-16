import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/backtest"],
    },
    sitemap: "https://traderadar.co.za/sitemap.xml",
  };
}
