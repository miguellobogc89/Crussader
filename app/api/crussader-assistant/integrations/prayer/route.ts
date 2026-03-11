// app/api/crussader-assistant/integrations/prayer/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PRAYER_API_URL =
  "https://the-daily-bible-reading-audio-api.vercel.app/v1/today";

export async function GET() {
  try {
    const res = await fetch(PRAYER_API_URL, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Prayer API error: ${res.status}`,
        },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      ok: true,
      source: "daily-prayer-api",
      item: {
        title: data?.title || "",
        date: data?.date || "",
        gospel: data?.gospel || data?.reading || "",
        prayer: data?.prayer || "",
        reflection: data?.reflection || "",
        audioUrl: data?.audio || data?.audio_url || "",
        raw: data,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown prayer fetch error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}