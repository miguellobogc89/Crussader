// lib/crussader-assistant/tools/news/getSportsNews.ts
export type GetSportsNewsInput = {
  q?: string;
  include?: string[];
  exclude?: string[];
  match_scope?: "title" | "title_description";
  limit?: number;
};

export async function getSportsNews(input: GetSportsNewsInput) {
  const params = new URLSearchParams();

  if (input.q) {
    params.set("q", input.q);
  }

  if (input.include && input.include.length > 0) {
    params.set("include", input.include.join(","));
  }

  if (input.exclude && input.exclude.length > 0) {
    params.set("exclude", input.exclude.join(","));
  }

  if (input.match_scope) {
    params.set("match_scope", input.match_scope);
  }

  if (input.limit) {
    params.set("limit", String(input.limit));
  }

  const res = await fetch(
    `${process.env.APP_URL}/api/crussader-assistant/integrations/news/sports?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("sports_news_fetch_failed");
  }

  return await res.json();
}