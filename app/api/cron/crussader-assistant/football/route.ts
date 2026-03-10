// app/api/crussader-assistant/cron/football/route.ts
import { NextResponse } from "next/server";
import { runFootballEventDetector } from "@/lib/crussader-assistant/sports/football/runFootballEventDetector";
import { runFootballDeliverySender } from "@/lib/crussader-assistant/sports/football/runFootballDeliverySender";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const origin = new URL(req.url).origin;

    const ingestRes = await fetch(
      `${origin}/api/crussader-assistant/integrations/live/sports/api-football/football`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const ingest = await ingestRes.json();

    if (!ingestRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          step: "ingest",
          ingest,
        },
        { status: 500 }
      );
    }

    const detector = await runFootballEventDetector();
    const sender = await runFootballDeliverySender();

    return NextResponse.json({
      ok: true,
      ingest,
      detector,
      sender,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "FOOTBALL_CRON_FAILED",
      },
      { status: 500 }
    );
  }
}