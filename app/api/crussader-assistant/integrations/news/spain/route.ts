// app/api/crussader-assistant/integrations/news/spain/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function formatDateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing NEWS_API_KEY" },
        { status: 500 }
      );
    }

    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 3);

    const to = new Date(now);
    to.setDate(to.getDate() - 1);

    const url =
      `https://newsapi.org/v2/everything` +
      `?q=(España OR Gobierno OR Sevilla OR Betis)` +
      `&language=es` +
      `&sortBy=publishedAt` +
      `&from=${formatDateUTC(from)}` +
      `&to=${formatDateUTC(to)}` +
      `&pageSize=5`;

    const res = await fetch(url, {
      headers: {
        "X-Api-Key": apiKey,
      },
      cache: "no-store",
    });

    const json = await res.json();

    if (!json.articles) {
      return NextResponse.json({ ok: true, items: [], raw: json });
    }

    const items = json.articles.map((a: any) => ({
      title: a.title,
      source: a.source?.name ?? "",
      url: a.url,
      publishedAt: a.publishedAt ?? null,
    }));

    return NextResponse.json({
      ok: true,
      totalResults: json.totalResults ?? 0,
      items,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message ?? "News fetch error" },
      { status: 500 }
    );
  }
}