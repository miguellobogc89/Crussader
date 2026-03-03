// app/api/whatsapp/agent/turns/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizePhone(p: string): string {
  return String(p || "").replace(/[^\d]/g, "");
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const companyId = url.searchParams.get("companyId") || "";
  const conversationId = url.searchParams.get("conversationId") || "";
  const limitRaw = url.searchParams.get("limit") || "120";
  const limit = Math.min(Math.max(Number(limitRaw) || 120, 1), 500);

  if (!companyId) {
    return NextResponse.json({ ok: false, error: "Missing companyId" }, { status: 400 });
  }

  if (!conversationId) {
    return NextResponse.json({ ok: false, error: "Missing conversationId" }, { status: 400 });
  }

  // 1) Verificar que la conversación pertenece a la company (via installation)
  const conv = await prisma.messaging_conversation.findFirst({
    where: {
      id: conversationId,
      integration_installation: {
        company_id: companyId,
        provider: "whatsapp",
      },
    },
    select: { id: true, contact_phone_e164: true, contact_external_id: true },
  });

  if (!conv) {
    return NextResponse.json({ ok: true, sessionId: null, events: [], memory: null });
  }

  // 2) Resolver caller por teléfono del contacto (digits)
  const callerRaw =
    typeof conv.contact_phone_e164 === "string" && conv.contact_phone_e164.length > 0
      ? conv.contact_phone_e164
      : typeof conv.contact_external_id === "string"
        ? conv.contact_external_id
        : "";

  const caller = normalizePhone(callerRaw);

  if (!caller) {
    return NextResponse.json({ ok: true, sessionId: null, events: [], memory: null });
  }

  // 3) Última sesión activa para ese caller dentro de la company
  const session = await prisma.agentSession.findFirst({
    where: {
      companyId,
      caller,
      status: { in: ["INIT", "ACTIVE"] },
    },
    orderBy: { startedAt: "desc" },
    select: { id: true, settings: true },
  });

  if (!session) {
    return NextResponse.json({ ok: true, sessionId: null, events: [], memory: null });
  }

  // 4) Turns SYSTEM
  const turns = await prisma.agentTurn.findMany({
    where: { sessionId: session.id, role: "SYSTEM" },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, text: true, payload: true, createdAt: true },
  });

  const events = turns.map((t) => ({
    id: t.id,
    at: t.createdAt.getTime(),
    text: t.text ?? "",
    payload: t.payload ?? null,
  }));

  const settings = (session.settings ?? null) as any;
  const memory =
    settings && typeof settings === "object" && settings.memory && typeof settings.memory === "object"
      ? settings.memory
      : null;

  return NextResponse.json({ ok: true, sessionId: session.id, events, memory });
}