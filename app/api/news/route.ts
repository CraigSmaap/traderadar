import { NextResponse } from "next/server";

type LiveNewsArticle = {
  title: string;
  description?: string;
  url?: string;
  source?: {
    id?: string | null;
    name?: string;
  };
  publishedAt?: string;
};

type NewsApiResponse = {
  articles?: LiveNewsArticle[];
  status?: string;
  code?: string;
  message?: string;
};

type CachedNewsState = {
  articles: LiveNewsArticle[];
  fetchedAt: number | null;
};

const FALLBACK_ARTICLES: LiveNewsArticle[] = [
  {
    title: "Markets await fresh macro catalysts as global risk sentiment stays mixed",
    description:
      "Investors remain cautious while monitoring inflation, rates, commodities, and geopolitical developments.",
    source: {
      id: "fallback",
      name: "TradeRadar Fallback",
    },
    publishedAt: new Date().toISOString(),
    url: "#",
  },
  {
    title: "Dollar and commodity sensitivity remain key for South African traders",
    description:
      "USD strength, metals, and energy remain central themes for rand-linked positioning.",
    source: {
      id: "fallback",
      name: "TradeRadar Fallback",
    },
    publishedAt: new Date().toISOString(),
    url: "#",
  },
  {
    title: "Gold and defensive assets stay in focus during uncertain global conditions",
    description:
      "Safe-haven demand remains relevant when macro conviction is weak and risk appetite fades.",
    source: {
      id: "fallback",
      name: "TradeRadar Fallback",
    },
    publishedAt: new Date().toISOString(),
    url: "#",
  },
];

const CACHE_TTL_MS = 25 * 60 * 1000;

let cachedNews: CachedNewsState = {
  articles: [],
  fetchedAt: null,
};

function getSafeArticles(articles: LiveNewsArticle[] | undefined): LiveNewsArticle[] {
  if (!Array.isArray(articles)) {
    return [];
  }

  return articles.filter(
    (article) =>
      typeof article.title === "string" && article.title.trim().length > 0
  );
}

function hasFreshCache() {
  if (!cachedNews.fetchedAt) {
    return false;
  }

  return Date.now() - cachedNews.fetchedAt < CACHE_TTL_MS;
}

function buildSuccessResponse(
  articles: LiveNewsArticle[],
  source: "live" | "cache" | "fallback"
) {
  return NextResponse.json(
    {
      articles,
      meta: {
        source,
        cached: source !== "live",
        fetchedAt:
          source === "live"
            ? new Date().toISOString()
            : cachedNews.fetchedAt
            ? new Date(cachedNews.fetchedAt).toISOString()
            : new Date().toISOString(),
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=1500, stale-while-revalidate=1500",
      },
    }
  );
}

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return buildSuccessResponse(FALLBACK_ARTICLES, "fallback");
  }

  if (hasFreshCache() && cachedNews.articles.length > 0) {
    return buildSuccessResponse(cachedNews.articles, "cache");
  }

  try {
    const res = await fetch(
      "https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=5",
      {
        headers: {
          Authorization: apiKey,
        },
        cache: "no-store",
      }
    );

    const data: NewsApiResponse = await res.json();

    if (!res.ok) {
      if (cachedNews.articles.length > 0) {
        console.warn("News API returned non-OK status, serving cached news:", res.status);
        return buildSuccessResponse(cachedNews.articles, "cache");
      }

      console.warn(
        "News API returned non-OK status, serving fallback news:",
        res.status,
        data.message
      );
      return buildSuccessResponse(FALLBACK_ARTICLES, "fallback");
    }

    const safeArticles = getSafeArticles(data.articles);

    if (safeArticles.length > 0) {
      cachedNews = {
        articles: safeArticles,
        fetchedAt: Date.now(),
      };

      return buildSuccessResponse(safeArticles, "live");
    }

    if (cachedNews.articles.length > 0) {
      return buildSuccessResponse(cachedNews.articles, "cache");
    }

    return buildSuccessResponse(FALLBACK_ARTICLES, "fallback");
  } catch (error) {
    console.error("Server news fetch error:", error);

    if (cachedNews.articles.length > 0) {
      return buildSuccessResponse(cachedNews.articles, "cache");
    }

    return buildSuccessResponse(FALLBACK_ARTICLES, "fallback");
  }
}