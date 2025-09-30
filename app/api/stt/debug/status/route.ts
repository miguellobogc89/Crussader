// app/api/stt/debug/status/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.DEEPGRAM_API_KEY;
  const pid = process.env.DEEPGRAM_PROJECT_ID;
  return NextResponse.json({
    has_api_key: Boolean(key),
    has_project_id: Boolean(pid),
    api_key_len: key ? key.length : 0,
    project_id_len: pid ? pid.length : 0,
  });
}
