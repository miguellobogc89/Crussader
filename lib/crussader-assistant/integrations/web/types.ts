// lib/crussader-assistant/integrations/web/types.ts
export type WebProviderName = "wikipedia" | "brave" | "duckduckgo";

export type WebSearchItem = {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  source: string;
};

export type WebSearchSuccess = {
  ok: true;
  query: string;
  provider: WebProviderName;
  answer: {
    title: string;
    description: string;
    content: string;
    url: string;
    imageUrl: string | null;
  };
  items: WebSearchItem[];
};

export type WebSearchFailure = {
  ok: false;
  query: string;
  provider: WebProviderName;
  error: string;
};

export type WebSearchProviderResult = WebSearchSuccess | WebSearchFailure;

export type SearchWebOptions = {
  query: string;
  lang?: string;
  provider?: WebProviderName;
};

export type SearchWebResult =
  | WebSearchSuccess
  | {
      ok: false;
      query: string;
      attemptedProviders: WebProviderName[];
      error: string;
    };

export type WebProviderHandler = (options: {
  query: string;
  lang?: string;
}) => Promise<WebSearchProviderResult>;