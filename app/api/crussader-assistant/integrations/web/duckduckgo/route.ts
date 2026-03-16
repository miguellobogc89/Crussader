// app/api/crussader-assistant/integrations/web/duckduckgo/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanRelatedTopics(topics: any[]): Array<{
  text: string;
  firstUrl: string;
  iconUrl: string | null;
}> {
  const results: Array<{
    text: string;
    firstUrl: string;
    iconUrl: string | null;
  }> = [];

  for (const item of topics) {
    if (!item) {
      continue;
    }

    if (Array.isArray(item.Topics)) {
      for (const nested of item.Topics) {
        if (!nested) {
          continue;
        }

        if (typeof nested.Text !== "string" || typeof nested.FirstURL !== "string") {
          continue;
        }

        let iconUrl: string | null = null;

        if (nested.Icon && typeof nested.Icon.URL === "string" && nested.Icon.URL.trim() !== "") {
          iconUrl = nested.Icon.URL;
        }

        results.push({
          text: nested.Text,
          firstUrl: nested.FirstURL,
          iconUrl
        });
      }

      continue;
    }

    if (typeof item.Text !== "string" || typeof item.FirstURL !== "string") {
      continue;
    }

    let iconUrl: string | null = null;

    if (item.Icon && typeof item.Icon.URL === "string" && item.Icon.URL.trim() !== "") {
      iconUrl = item.Icon.URL;
    }

    results.push({
      text: item.Text,
      firstUrl: item.FirstURL,
      iconUrl
    });
  }

  return results;
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing query parameter: q"
        },
        { status: 400 }
      );
    }

    const upstreamUrl =
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}` +
      `&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "DuckDuckGo upstream error",
          status: response.status
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    let abstractText = "";
    let abstractUrl = "";
    let heading = "";

    if (typeof data.AbstractText === "string") {
      abstractText = data.AbstractText;
    }

    if (typeof data.AbstractURL === "string") {
      abstractUrl = data.AbstractURL;
    }

    if (typeof data.Heading === "string") {
      heading = data.Heading;
    }

    const relatedTopics = Array.isArray(data.RelatedTopics)
      ? cleanRelatedTopics(data.RelatedTopics).slice(0, 8)
      : [];

    return NextResponse.json({
      ok: true,
      provider: "duckduckgo",
      query,
      result: {
        heading,
        abstractText,
        abstractUrl,
        relatedTopics
      },
      raw: data
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}