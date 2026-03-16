// app/api/debug/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { interpretScheduleToJson } from "@/lib/crussader-assistant/domains/events/helpers/interpretScheduleToJson";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || !body.text) {
    return NextResponse.json({ ok: false, error: "missing_text" });
  }

  try {
    const schedule = await interpretScheduleToJson(body.text);

    return NextResponse.json({
      ok: true,
      input: body.text,
      schedule,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: "schedule_parse_failed",
    });
  }
}