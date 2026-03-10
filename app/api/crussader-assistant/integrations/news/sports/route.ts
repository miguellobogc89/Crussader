// app/api/crussader-assistant/integrations/news/sports/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NewsItem = {
  title: string;
  source: string;
  link: string;
  date: string;
  description: string;
  image: string;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(title: string): string {
  return normalizeText(title);
}

function parseCsvParam(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => normalizeText(part));
}

function safeLimit(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  if (parsed < 1) {
    return fallback;
  }

  if (parsed > 20) {
    return 20;
  }

  return parsed;
}

function getHoursAgo(dateString: string): number {
  if (!dateString) {
    return 9999;
  }

  const timestamp = Date.parse(dateString);

  if (Number.isNaN(timestamp)) {
    return 9999;
  }

  const diffMs = Date.now() - timestamp;

  if (diffMs <= 0) {
    return 0;
  }

  return diffMs / (1000 * 60 * 60);
}

function getFreshnessScore(dateString: string): number {
  const hoursAgo = getHoursAgo(dateString);

  if (hoursAgo <= 3) {
    return 4;
  }

  if (hoursAgo <= 6) {
    return 3;
  }

  if (hoursAgo <= 12) {
    return 2;
  }

  if (hoursAgo <= 24) {
    return 1;
  }

  return 0;
}

function getRelevanceScore(
  item: NewsItem,
  qTerms: string[],
  includeTerms: string[]
): number {
  const title = normalizeText(item.title || "");
  const description = normalizeText(item.description || "");

  let score = 0;

  for (const term of includeTerms) {
    if (title.startsWith(term)) {
      score += 12;
      continue;
    }

    if (title.includes(term)) {
      score += 8;
      continue;
    }

    if (description.includes(term)) {
      score += 3;
    }
  }

  for (const term of qTerms) {
    if (title.startsWith(term)) {
      score += 7;
      continue;
    }

    if (title.includes(term)) {
      score += 5;
      continue;
    }

    if (description.includes(term)) {
      score += 2;
    }
  }

  score += getFreshnessScore(item.date || "");

  return score;
}

function dedupeItems(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const unique: NewsItem[] = [];

  for (const item of items) {
    const key = normalizeTitle(item.title || "");

    if (!key) {
      continue;
    }

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(item);
  }

  return unique;
}
function matchesAnyTopic(item: NewsItem, terms: string[]): boolean {
  if (terms.length === 0) {
    return true;
  }

  const title = normalizeText(item.title || "");
  const description = normalizeText(item.description || "");
  const text = title + " " + description;

  for (const term of terms) {
    if (text.includes(term)) {
      return true;
    }
  }

  return false;
}

function parseTopicTerms(searchParams: URLSearchParams): string[] {
  const out: string[] = [];

  const pushUnique = (value: string) => {
    const normalized = normalizeText(value);

    if (!normalized) {
      return;
    }

    if (out.includes(normalized)) {
      return;
    }

    out.push(normalized);
  };

  const topic = searchParams.get("topic");

  if (topic) {
    pushUnique(topic);
  }

  const topicsParam = searchParams.get("topics");

  if (topicsParam) {
    const parts = topicsParam.split(",");

    for (const part of parts) {
      pushUnique(part);
    }
  }

  return out;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const limit = safeLimit(searchParams.get("limit"), 5);
    const qTerms = parseCsvParam(searchParams.get("q"));
    const includeTerms = parseCsvParam(searchParams.get("include"));
    const topicTerms = parseTopicTerms(searchParams);

    for (const term of topicTerms) {
      if (!includeTerms.includes(term)) {
        includeTerms.push(term);
      }
    }

    const providerUrl =
      url.origin +
      "/api/crussader-assistant/integrations/news/newsdataio/sports?" +
      searchParams.toString();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res: Response;

    try {
      res = await fetch(providerUrl, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    let data: any = null;

    try {
      data = await res.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          provider: "news_aggregator",
          error: "invalid_provider_response",
        },
        { status: 502 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          provider: "news_aggregator",
          error: "provider_error",
          provider_status: res.status,
          details: data,
        },
        { status: res.status }
      );
    }

const rawItems = Array.isArray(data.items) ? data.items : [];
const dedupedItems = dedupeItems(rawItems);

const filteredItems =
  topicTerms.length > 0
    ? dedupedItems.filter((item) => matchesAnyTopic(item, topicTerms))
    : dedupedItems;

const scoredItems = filteredItems
      .map((item: NewsItem) => {
        return {
          ...item,
          _score: getRelevanceScore(item, qTerms, includeTerms),
          _hoursAgo: getHoursAgo(item.date || ""),
        };
      })
      .sort((a, b) => {
        if (b._score !== a._score) {
          return b._score - a._score;
        }

        if (a._hoursAgo !== b._hoursAgo) {
          return a._hoursAgo - b._hoursAgo;
        }

        return 0;
      });

    const finalItems = scoredItems.slice(0, limit).map((item) => {
      return {
        title: item.title,
        source: item.source,
        link: item.link,
        date: item.date,
        description: item.description,
        image: item.image,
      };
    });

    return NextResponse.json({
      ok: true,
      provider: "news_aggregator",
      vertical: "sports",
      upstream_provider: "newsdataio",
      filters: {
        ...(data.filters || {}),
        topic: searchParams.get("topic") || "",
        topics: topicTerms,
        include: includeTerms,
        limit,
      },
      meta: {
        raw_count: rawItems.length,
        deduped_count: dedupedItems.length,
        filtered_count: filteredItems.length,
        returned_count: finalItems.length,
      },
      items: finalItems,
    });
  } catch (error: any) {
    let errorCode = "aggregator_error";

    if (error && error.name === "AbortError") {
      errorCode = "provider_timeout";
    }

    return NextResponse.json(
      {
        ok: false,
        provider: "news_aggregator",
        error: errorCode,
      },
      { status: 500 }
    );
  }
}