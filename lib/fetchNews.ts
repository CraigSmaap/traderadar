export type LiveNewsArticle = {
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
};

export async function fetchNews(): Promise<LiveNewsArticle[]> {
  const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;

  if (!apiKey) {
    console.error("Missing NEXT_PUBLIC_NEWS_API_KEY");
    return [];
  }

  try {
    const res = await fetch(
      "https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=5",
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    const data: NewsApiResponse = await res.json();

    return data.articles || [];
  } catch (error) {
    console.error("News fetch error:", error);
    return [];
  }
}