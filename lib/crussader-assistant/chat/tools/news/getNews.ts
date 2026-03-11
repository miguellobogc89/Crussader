// lib/crussader-assistant/chat/tools/news/getNews.ts

type GetNewsInput = {
  category?: "general" | "sports" | string;
  topic?: string;
  topics?: string[];
  country?: string;
  limit?: number;
  include?: string[];
  exclude?: string[];
  match_scope?: "title" | "title_description";
  query?: string;
};

function asText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeCategory(value: unknown): string {
  const raw = asText(value).toLowerCase();

  if (!raw) {
    return "";
  }

  if (raw === "sport") {
    return "sports";
  }

  if (raw === "deporte") {
    return "sports";
  }

  if (raw === "deportes") {
    return "sports";
  }

  if (raw === "news") {
    return "general";
  }

  if (raw === "noticias") {
    return "general";
  }

  return raw;
}

function normalizeLimit(value: unknown): number {
  const num = Number(value);

  if (!Number.isInteger(num)) {
    return 5;
  }

  if (num < 1) {
    return 5;
  }

  if (num > 10) {
    return 10;
  }

  return num;
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const out: string[] = [];

  for (const item of value) {
    const text = asText(item);

    if (!text) {
      continue;
    }

    if (out.includes(text)) {
      continue;
    }

    out.push(text);
  }

  return out;
}

function appendCsvParam(params: URLSearchParams, key: string, values: string[]) {
  if (values.length === 0) {
    return;
  }

  params.set(key, values.join(","));
}

export async function getNews(input: GetNewsInput) {
  const category = normalizeCategory(input.category);
  const topic = asText(input.topic);
  const topics = normalizeList(input.topics);
  const query = asText(input.query);
  const country = asText(input.country || "es");
  const limit = normalizeLimit(input.limit);
  const include = normalizeList(input.include);
  const exclude = normalizeList(input.exclude);
  const matchScope = asText(input.match_scope);

  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (country) {
    params.set("country", country);
  }

  params.set("limit", String(limit));

  if (topic) {
    params.set("topic", topic);
  }

  appendCsvParam(params, "topics", topics);
  appendCsvParam(params, "include", include);
  appendCsvParam(params, "exclude", exclude);

  if (matchScope) {
    params.set("match_scope", matchScope);
  }

  const baseUrl = process.env.APP_URL || "http://localhost:3000";

  let endpoint = "/api/crussader-assistant/integrations/news";

  if (category === "sports") {
    endpoint = "/api/crussader-assistant/integrations/news/sports";
  }

  const url = baseUrl + endpoint + "?" + params.toString();

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const rawText = await res.text();

  let data: any = null;

  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("Invalid news response");
  }

  if (!res.ok) {
    throw new Error("get_news_failed");
  }

  return data;
}