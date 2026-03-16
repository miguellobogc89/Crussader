// lib/crussader-assistant/integrations/web/providers/wikipedia.ts
import type { WebProviderHandler, WebSearchItem, WebSearchProviderResult } from "../types";

type WikipediaSummaryResponse = {
  title?: string;
  description?: string;
  extract?: string;
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
  thumbnail?: {
    source?: string;
  };
};

function buildWikipediaTitleFromQuery(rawQuery: string) {
  return rawQuery.trim().replace(/\s+/g, "_");
}

export const searchWikipedia: WebProviderHandler = async ({ query, lang }) => {
  const safeLang = typeof lang === "string" && lang.trim() ? lang.trim() : "es";
  const title = buildWikipediaTitleFromQuery(query);
  const url = `https://${safeLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (response.status === 404) {
      return {
        ok: false,
        query,
        provider: "wikipedia",
        error: "Page not found"
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        query,
        provider: "wikipedia",
        error: `Wikipedia upstream error: ${response.status}`
      };
    }

    const data = (await response.json()) as WikipediaSummaryResponse;

    const resultTitle = typeof data.title === "string" ? data.title.trim() : "";
    const resultDescription = typeof data.description === "string" ? data.description.trim() : "";
    const resultContent = typeof data.extract === "string" ? data.extract.trim() : "";
    const resultUrl =
      typeof data.content_urls?.desktop?.page === "string"
        ? data.content_urls.desktop.page
        : "";
    const imageUrl =
      typeof data.thumbnail?.source === "string" && data.thumbnail.source.trim()
        ? data.thumbnail.source
        : null;

    if (!resultTitle && !resultContent) {
      return {
        ok: false,
        query,
        provider: "wikipedia",
        error: "Empty result"
      };
    }

    const items: WebSearchItem[] = [
      {
        title: resultTitle,
        description: resultDescription,
        url: resultUrl,
        imageUrl,
        source: "Wikipedia"
      }
    ];

    return {
      ok: true,
      query,
      provider: "wikipedia",
      answer: {
        title: resultTitle,
        description: resultDescription,
        content: resultContent,
        url: resultUrl,
        imageUrl
      },
      items
    };
  } catch (error) {
    return {
      ok: false,
      query,
      provider: "wikipedia",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};