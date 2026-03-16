// app/api/crussader-assistant/integrations/news/route.ts
import { NextRequest, NextResponse } from "next/server";
import { filterNewsItems } from "@/lib/crussader-assistant/legacy/bridges/news/filterNewsItems";

export const dynamic = "force-dynamic";

const API_KEY = process.env.NEWSDATAIO_API_KEY;
const BASE_URL = "https://newsdata.io/api/1/news";

function parseCsvParam(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

export async function GET(req: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Falta NEWSDATAIO_API_KEY en el entorno" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q") || "";
    const country = searchParams.get("country") || "es";
    const limitRaw = searchParams.get("limit") || "5";

    const include = parseCsvParam(searchParams.get("include"));
    const exclude = parseCsvParam(searchParams.get("exclude"));

    const limit = Number(limitRaw);
    let safeLimit = 5;

    if (Number.isFinite(limit) && limit > 0) {
      safeLimit = limit;
    }

    const params = new URLSearchParams();
    params.set("apikey", API_KEY);
    params.set("country", country);
    params.set("language", "es");

    if (q.trim() !== "") {
      params.set("q", q.trim());
    }

    const url = `${BASE_URL}?${params.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();

      return NextResponse.json(
        {
          ok: false,
          error: "Error al consultar NewsData.io",
          details: errorText,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawResults = Array.isArray(data.results) ? data.results : [];

    const items = rawResults.map((n: any) => {
      let title = "";
      if (typeof n.title === "string") {
        title = n.title;
      }

      let source = "";
      if (typeof n.source_id === "string") {
        source = n.source_id;
      }

      let link = "";
      if (typeof n.link === "string") {
        link = n.link;
      }

      let date = "";
      if (typeof n.pubDate === "string") {
        date = n.pubDate;
      }

      let description = "";
      if (typeof n.description === "string") {
        description = n.description;
      }

      let image = "";
      if (typeof n.image_url === "string") {
        image = n.image_url;
      }

      return {
        title,
        source,
        link,
        date,
        description,
        image,
      };
    });

const filtered = filterNewsItems(items, {
  include,
  exclude,
  limit: safeLimit,
});

return NextResponse.json({
  ok: true,
  provider: "newsdataio",
  filters: {
    q,
    country,
    limit: safeLimit,
    include,
    exclude,
  },
  total_raw: items.length,
  total_filtered: filtered.items.length,
  items: filtered.items,
  rejected: filtered.rejected,
});

  } catch (error) {
    let message = "Error interno";

    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Error interno al obtener noticias",
        details: message,
      },
      { status: 500 }
    );
  }
}