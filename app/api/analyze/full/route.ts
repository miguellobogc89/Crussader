// app/api/analyze/full/route.ts
export const runtime = "nodejs";

// (haz GET y POST para probar también en navegador)
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, ping: "full-route-alive", method: "GET" });
}

export async function POST() {
  return NextResponse.json({ ok: true, ping: "full-route-alive", method: "POST" });
}
