// app/api/crussader-assistant/integrations/news/newsdataio/sports/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const apiKey = process.env.NEWSDATAIO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing NEWSDATAIO_API_KEY" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q");
    const categoryParam = searchParams.get("category");
    const limitParam = searchParams.get("limit");
    const includeParam = searchParams.get("include");
    const excludeParam = searchParams.get("exclude");
    const matchScope = searchParams.get("match_scope") || "title_description";

    let category = "sports";
    if (categoryParam) {
      category = categoryParam;
    }

    let limit = 5;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 20) {
        limit = parsedLimit;
      }
    }

    const include = includeParam
      ? includeParam.toLowerCase().split(",").map(s => s.trim())
      : [];

    const exclude = excludeParam
      ? excludeParam.toLowerCase().split(",").map(s => s.trim())
      : [];

    const upstreamParams = new URLSearchParams();
    upstreamParams.set("apikey", apiKey);
    upstreamParams.set("language", "es");
    upstreamParams.set("country", "es");
    upstreamParams.set("category", category);

    if (q) {
      upstreamParams.set("q", q);
    }

    const upstreamUrl =
      "https://newsdata.io/api/1/latest?" + upstreamParams.toString();

    const res = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, provider: "newsdataio", error: "upstream_error" },
        { status: res.status }
      );
    }

    let results = Array.isArray(data.results) ? data.results : [];

    if (include.length > 0 || exclude.length > 0) {
      results = results.filter((a: any) => {
const titleText = (a.title || "").toLowerCase();
const descriptionText = (a.description || "").toLowerCase();

let text = titleText;

if (matchScope === "title_description") {
  text = titleText + " " + descriptionText;
}

        let includeMatch = true;
        if (include.length > 0) {
          includeMatch = include.some(word => text.includes(word));
        }

        let excludeMatch = false;
        if (exclude.length > 0) {
          excludeMatch = exclude.some(word => text.includes(word));
        }

        return includeMatch && !excludeMatch;
      });
    }
if (include.length > 0) {
  results.sort((a: any, b: any) => {
    const titleA = (a.title || "").toLowerCase();
    const titleB = (b.title || "").toLowerCase();

    const score = (title: string) => {
      for (const term of include) {
        if (title.startsWith(term)) return 3;
        if (title.includes(term)) return 2;
      }
      return 1;
    };

    return score(titleB) - score(titleA);
  });
}
    const items = results.slice(0, limit).map((a: any) => ({
      title: a.title || "",
      source: a.source_id || "",
      link: a.link || "",
      date: a.pubDate || "",
      description: a.description || "",
      image: a.image_url || "",
    }));

    return NextResponse.json({
      ok: true,
      provider: "newsdataio",
      filters: {
        q: q || "",
        category,
        include,
        exclude,
        match_scope: matchScope,
        limit,
      },
      items,
    });

  } catch {
    return NextResponse.json(
      { ok: false, provider: "newsdataio", error: "news_fetch_error" },
      { status: 500 }
    );
  }
}