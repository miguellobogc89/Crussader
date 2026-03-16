// lib/crussader-assistant/integrations/providers/web/braveSearch.ts
import type { WebProviderHandler, WebSearchItem } from "../types";

type BraveSearchApiResult = {
  title?: string;
  description?: string;
  url?: string;
};

type BraveSearchApiResponse = {
  web?: {
    results?: BraveSearchApiResult[];
  };
};

function getApiKey() {
  const key = process.env.BRAVE_SEARCH_API_KEY;

  if (!key) {
    throw new Error("Missing BRAVE_SEARCH_API_KEY");
  }

  return key;
}

function buildUrl(query: string, lang?: string) {
  const params = new URLSearchParams();

  params.set("q", query);
  params.set("count", "5");

  if (lang && lang.trim() !== "") {
    params.set("search_lang", lang);
  }

  return `https://api.search.brave.com/res/v1/web/search?${params.toString()}`;
}

export const braveSearch: WebProviderHandler = async ({ query, lang }) => {
  const normalizedQuery = String(query || "").trim();

  if (!normalizedQuery) {
    return {
      ok: false,
      query: normalizedQuery,
      provider: "brave",
      error: "Missing query"
    };
  }

  try {
    const apiKey = getApiKey();
    const url = buildUrl(normalizedQuery, lang);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey
      },
      cache: "no-store"
    });

    const data = (await response.json()) as BraveSearchApiResponse;

    if (!response.ok) {
      return {
        ok: false,
        query: normalizedQuery,
        provider: "brave",
        error: `Brave API error ${response.status}`
      };
    }

    const rawResults = Array.isArray(data.web?.results) ? data.web.results : [];
    const items: WebSearchItem[] = [];

    for (const rawItem of rawResults) {
      const title = String(rawItem.title || "").trim();
      const description = String(rawItem.description || "").trim();
      const resultUrl = String(rawItem.url || "").trim();

      if (!resultUrl) {
        continue;
      }

      if (!title && !description) {
        continue;
      }

      items.push({
        title,
        description,
        url: resultUrl,
        imageUrl: null,
        source: "Brave"
      });
    }

    if (items.length === 0) {
      return {
        ok: false,
        query: normalizedQuery,
        provider: "brave",
        error: "No usable results"
      };
    }

    const first = items[0];

    return {
      ok: true,
      query: normalizedQuery,
      provider: "brave",
      answer: {
        title: first.title,
        description: first.description,
        content: "",
        url: first.url,
        imageUrl: null
      },
      items
    };
  } catch (error) {
    return {
      ok: false,
      query: normalizedQuery,
      provider: "brave",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};