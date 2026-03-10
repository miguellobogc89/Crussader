// app/api/crussader-assistant/conversations/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    const limitRaw = Number(searchParams.get("limit") || 200);
    const limit = Math.min(Math.max(limitRaw || 200, 1), 500);

    const conversation = await prisma.messaging_conversation.findFirst({
      where: {
        id: conversationId,
        integration_installation: {
          company_id: companyId,
          provider: "whatsapp",
        },
      },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found for company" },
        { status: 404 }
      );
    }

    const messages = await prisma.messaging_message.findMany({
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

    const events = messages.map((message) => {
      const atDate = message.provider_ts ?? message.created_at;
      const at = atDate.getTime();

      if (message.direction === "in") {
        return {
          kind: "message" as const,
          at,
          from: "db",
          id: message.id,
          type: message.kind,
          text: message.text ?? "",
          ts: atDate.toISOString(),
        };
      }

      return {
        kind: "out" as const,
        at,
        to: "db",
        id: message.id,
        text: message.text ?? "",
        ts: atDate.toISOString(),
        status: message.status ?? null,
      };
    });

    return NextResponse.json({ ok: true, events });
  } catch (error) {
    let message = "Error al listar mensajes";

    if (error instanceof Error && error.message) {
      message = error.message;
    }

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}