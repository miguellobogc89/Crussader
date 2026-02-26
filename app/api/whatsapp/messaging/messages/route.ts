// app/api/whatsapp/messaging/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/whatsapp/messaging/messages?companyId=...&conversationId=...&limit=200
 * Devuelve eventos compatibles con ChatPanel (WaDebugEvent[])
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const companyId = searchParams.get("companyId");
    const conversationId = searchParams.get("conversationId");

    if (!companyId || !conversationId) {
      return NextResponse.json(
        { ok: false, error: "companyId y conversationId requeridos" },
        { status: 400 }
      );
    }

    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);

    // Seguridad: conversación pertenece a la company (via instalación)
    const conv = await prisma.messaging_conversation.findFirst({
      where: {
        id: conversationId,
        integration_installation: {
          company_id: companyId,
          provider: "whatsapp",
        },
      },
      select: { id: true },
    });

    if (!conv) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found for company" },
        { status: 404 }
      );
    }

    const msgs = await prisma.messaging_message.findMany({
      where: { conversation_id: conversationId },
      orderBy: [{ provider_ts: "asc" }, { created_at: "asc" }],
      take: limit,
      select: {
        id: true,
        direction: true,
        kind: true,
        text: true,
        status: true,
        provider_ts: true,
        created_at: true,
      },
    });

    // Adaptación al formato que espera ChatPanel hoy
    const events = msgs.map((m) => {
      const atDate = m.provider_ts ?? m.created_at;
      const at = atDate.getTime();

      if (m.direction === "in") {
        return {
          kind: "message",
          at,
          from: "db",
          id: m.id,
          type: m.kind,
          text: m.text ?? "",
          ts: atDate.toISOString(),
        };
      }

      return {
        kind: "out",
        at,
        to: "db",
        id: m.id,
        text: m.text ?? "",
        ts: atDate.toISOString(),
        status: m.status ?? null,
      };
    });

    return NextResponse.json({ ok: true, events });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error al listar mensajes" },
      { status: 500 }
    );
  }
}