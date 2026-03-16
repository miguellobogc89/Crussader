// lib/crussader-assistant/integrations/providers/web/index.ts
import { searchDuckDuckGo } from "./duckduckgo";
import { searchWikipedia } from "./wikipedia";
import { braveSearch } from "./braveSearch";
import type {
  SearchWebOptions,
  SearchWebResult,
  WebProviderHandler,
  WebProviderName
} from "../types";

const providerRegistry: Record<WebProviderName, WebProviderHandler> = {
  wikipedia: searchWikipedia,
  brave: braveSearch,
  duckduckgo: searchDuckDuckGo
};

function getProviderOrder(provider?: WebProviderName) {
  if (provider) {
    return [provider];
  }

  return ["wikipedia", "brave", "duckduckgo"] as WebProviderName[];
}

export async function searchWeb(options: SearchWebOptions): Promise<SearchWebResult> {
  const query = typeof options.query === "string" ? options.query.trim() : "";
  const lang = typeof options.lang === "string" ? options.lang.trim() : "es";
  const provider = options.provider;

  if (!query) {
    return {
      ok: false,
      query: "",
      attemptedProviders: [],
      error: "Missing query"
    };
  }

  const providers = getProviderOrder(provider);

  for (const providerName of providers) {
    const handler = providerRegistry[providerName];

    if (!handler) {
      continue;
    }

    const result = await handler({
      query,
      lang
    });

    if (result.ok) {
      return result;
    }
  }

  return {
    ok: false,
    query,
    attemptedProviders: providers,
    error: "No provider returned a valid result"
  };
}

export const webProviders = providerRegistry;