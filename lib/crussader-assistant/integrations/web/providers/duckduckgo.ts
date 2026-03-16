// lib/crussader-assistant/integrations/web/providers/duckduckgo.ts
import type { WebProviderHandler, WebSearchItem } from "../types";

type DuckDuckGoTopic = {
  Text?: string;
  FirstURL?: string;
  Icon?: {
    URL?: string;
  };
  Topics?: DuckDuckGoTopic[];
};

type DuckDuckGoResponse = {
  Heading?: string;
  AbstractText?: string;
  AbstractURL?: string;
  RelatedTopics?: DuckDuckGoTopic[];
};

function extractTopics(topics: DuckDuckGoTopic[]) {
  const results: WebSearchItem[] = [];

  for (const item of topics) {
    if (!item) {
      continue;
    }

    if (Array.isArray(item.Topics)) {
      const nestedResults = extractTopics(item.Topics);

      for (const nestedItem of nestedResults) {
        results.push(nestedItem);
      }

      continue;
    }

    const text = typeof item.Text === "string" ? item.Text.trim() : "";
    const firstUrl = typeof item.FirstURL === "string" ? item.FirstURL.trim() : "";
    const iconUrl =
      typeof item.Icon?.URL === "string" && item.Icon.URL.trim()
        ? item.Icon.URL
        : null;

    if (!text || !firstUrl) {
      continue;
    }

    results.push({
      title: text,
      description: text,
      url: firstUrl,
      imageUrl: iconUrl,
      source: "DuckDuckGo"
    });
  }

  return results;
}

export const searchDuckDuckGo: WebProviderHandler = async ({ query }) => {
  const url =
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}` +
    `&format=json&no_html=1&skip_disambig=1`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        ok: false,
        query,
        provider: "duckduckgo",
        error: `DuckDuckGo upstream error: ${response.status}`
      };
    }

    const data = (await response.json()) as DuckDuckGoResponse;

    const heading = typeof data.Heading === "string" ? data.Heading.trim() : "";
    const abstractText =
      typeof data.AbstractText === "string" ? data.AbstractText.trim() : "";
    const abstractUrl =
      typeof data.AbstractURL === "string" ? data.AbstractURL.trim() : "";

    const relatedTopics = Array.isArray(data.RelatedTopics)
      ? extractTopics(data.RelatedTopics).slice(0, 8)
      : [];

    const hasAnswer = Boolean(heading || abstractText || relatedTopics.length);

    if (!hasAnswer) {
      return {
        ok: false,
        query,
        provider: "duckduckgo",
        error: "Empty result"
      };
    }

    const fallbackTitle = heading || query;
    const fallbackDescription =
      abstractText || (relatedTopics[0]?.description ?? "");
    const fallbackUrl = abstractUrl || (relatedTopics[0]?.url ?? "");
    const fallbackImageUrl = relatedTopics[0]?.imageUrl ?? null;

    return {
      ok: true,
      query,
      provider: "duckduckgo",
      answer: {
        title: fallbackTitle,
        description: fallbackDescription,
        content: abstractText,
        url: fallbackUrl,
        imageUrl: fallbackImageUrl
      },
      items: relatedTopics
    };
  } catch (error) {
    return {
      ok: false,
      query,
      provider: "duckduckgo",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};