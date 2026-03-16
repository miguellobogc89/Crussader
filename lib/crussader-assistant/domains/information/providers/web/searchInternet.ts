// lib/crussader-assistant/domains/information/providers/web/searchInternet.ts
import type {
  WebProviderName,
  WebSearchItem
} from "@/lib/crussader-assistant/integrations/web/types";
import { searchWeb } from "@/lib/crussader-assistant/integrations/web/providers";

type SearchInternetArgs = {
  query: string;
  lang?: string;
  provider?: WebProviderName;
};

type SearchInternetResult = {
  ok: boolean;
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  source?: string;
  items?: WebSearchItem[];
  error?: string;
};

function normalizeSearchQuery(raw: string) {
  let text = raw.trim();

  text = text.replace(/[¿?]/g, "");
  text = text.replace(/^[Qq]ui[eé]n fue\s+/, "");
  text = text.replace(/^[Qq]ui[eé]n es\s+/, "");
  text = text.replace(/^[Qq]u[eé] es\s+/, "");
  text = text.replace(/^[Qq]u[eé] fue\s+/, "");
  text = text.replace(/^[Cc][óo]mo funciona\s+/, "");
  text = text.replace(/^[Cc]u[aá]l es\s+/, "");
  text = text.trim();

  if (!text) {
    return raw.trim();
  }

  return text;
}

export async function searchInternet(
  args: SearchInternetArgs
): Promise<SearchInternetResult> {
  const query = typeof args.query === "string" ? args.query.trim() : "";

  if (!query) {
    return {
      ok: false,
      error: "Missing query"
    };
  }

  try {
    const normalizedQuery = normalizeSearchQuery(query);

    console.log("[searchInternet][start]", {
      originalQuery: query,
      normalizedQuery,
      lang: args.lang,
      provider: args.provider
    });

    const data = await searchWeb({
      query: normalizedQuery,
      lang: args.lang,
      provider: args.provider
    });

    console.log("[searchInternet][response]", data);

    if (!data.ok) {
      return {
        ok: false,
        error: data.error || "No result"
      };
    }

    const answer = data.answer || {};
    const items = Array.isArray(data.items) ? data.items : [];

    return {
      ok: true,
      title: typeof answer.title === "string" ? answer.title : "",
      description: typeof answer.description === "string" ? answer.description : "",
      content: typeof answer.content === "string" ? answer.content : "",
      url: typeof answer.url === "string" ? answer.url : "",
      source: data.provider,
      items
    };
  } catch (error) {
    console.log("[searchInternet][error]", error);

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}