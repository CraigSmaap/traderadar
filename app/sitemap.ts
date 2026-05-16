import type { MetadataRoute } from "next";

const BASE = "https://traderadar.co.za";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,              lastModified: new Date(), changeFrequency: "daily",   priority: 1   },
    { url: `${BASE}/live`,    lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/login`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/terms`,   lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  ];
}
