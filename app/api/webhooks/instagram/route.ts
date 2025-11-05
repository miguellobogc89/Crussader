// Next.js App Router (Edge/Node)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

// ⚙️ Env vars (ponlas en Vercel)
const VERIFY_TOKEN = process.env.IG_VERIFY_TOKEN!;      // ej: "crussader2025"
const APP_SECRET   = process.env.IG_APP_SECRET!;        // el "App Secret" de tu app

// ── GET: verificación (hub.challenge) ─────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Verification failed", { status: 403 });
}

// ── POST: eventos (comentarios, menciones, etc.) ──────
export async function POST(req: NextRequest) {
  const raw = await req.text(); // leer texto crudo para firmar
  const signature = req.headers.get("x-hub-signature-256") ?? "";

  // Verificar firma HMAC SHA-256: "sha256=" + hex(hmac(body))
  const expected =
    "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(raw).digest("hex");

  if (signature !== expected) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  // Ya verificado: procesa el evento
  try {
    const payload = JSON.parse(raw);
    // TODO: guarda en DB, encola, etc.
    console.log("IG Webhook:", JSON.stringify(payload));
  } catch (e) {
    console.error("Parse error:", e);
  }

  return new NextResponse("OK", { status: 200 });
}
