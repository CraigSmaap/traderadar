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

type InternalNewsResponse = {
  articles?: LiveNewsArticle[];
};

export async function fetchNews(): Promise<LiveNewsArticle[]> {
  try {
    const res = await fetch("/api/news", {
  method: "GET",
  cache: "default",
});

    if (!res.ok) {
      console.error("Internal news fetch failed:", res.status, res.statusText);
      return [];
    }

    const data: InternalNewsResponse = await res.json();
    return Array.isArray(data.articles) ? data.articles : [];
  } catch (error) {
    console.error("News fetch error:", error);
    return [];
  }
}