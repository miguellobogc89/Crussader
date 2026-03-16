// app/api/crussader-assistant/integrations/web/wikipedia/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildWikipediaTitleFromQuery(rawQuery: string) {
  return rawQuery.trim().replace(/\s+/g, "_");
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q")?.trim() || "";
    const lang = req.nextUrl.searchParams.get("lang")?.trim() || "es";

    if (!query) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing query parameter: q"
        },
        { status: 400 }
      );
    }

    const title = buildWikipediaTitleFromQuery(query);
    const upstreamUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (response.status === 404) {
      return NextResponse.json(
        {
          ok: false,
          provider: "wikipedia",
          query,
          lang,
          error: "Page not found"
        },
        { status: 404 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Wikipedia upstream error",
          status: response.status
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      ok: true,
      provider: "wikipedia",
      query,
      lang,
      result: {
        title: data.title || "",
        description: data.description || "",
        extract: data.extract || "",
        contentUrls: data.content_urls || null,
        thumbnail: data.thumbnail || null
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