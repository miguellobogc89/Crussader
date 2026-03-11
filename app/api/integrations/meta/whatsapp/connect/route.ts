// app/api/integrations/meta/whatsapp/connect/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = (await req.json()) as { code?: string };

  if (!body.code) {
    return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });
  }

  // Debug por ahora (luego aquí haremos el intercambio por access_token)
  console.log("[WA CONNECT] received code:", body.code);

  return NextResponse.json({ ok: true });
}