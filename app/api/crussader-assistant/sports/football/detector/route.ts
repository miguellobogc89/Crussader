// app/api/crussader-assistant/sports/football/detector/route.ts
import { NextResponse } from "next/server";
import { runFootballEventDetector } from "@/lib/crussader-assistant/sports/football/runFootballEventDetector";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runFootballEventDetector();

    return NextResponse.json(result);
  } catch (err: unknown) {
    let details = "Unknown error";

    if (err instanceof Error) {
      details = err.message;
    }

    return NextResponse.json(
      {
        ok: false,
        error: "DETECTOR_FAILED",
        details,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "football detector",
    method: "POST",
  });
}