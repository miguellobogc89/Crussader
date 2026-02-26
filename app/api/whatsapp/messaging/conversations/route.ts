// app/api/whatsapp/messaging/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/whatsapp/messaging/conversations?companyId=...&limit=30&cursor=<conversationId>
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId requerido" },
        { status: 400 }
      );
    }

    const take = Math.min(Number(searchParams.get("limit") || 30), 100);
    const cursor = searchParams.get("cursor");

    // 1) Conversaciones de WhatsApp activas para esa company
    const conversations = await prisma.messaging_conversation.findMany({
      where: {
        integration_installation: {
          company_id: companyId,
          provider: "whatsapp",
        },
      },
      orderBy: [
        { last_message_at: "desc" },
        { created_at: "desc" },
      ],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        contact_external_id: true,
        contact_phone_e164: true,
        contact_name: true,
        status: true,
        last_message_at: true,
        last_read_at: true,
        created_at: true,
      },
    });

    let nextCursor: string | null = null;
    if (conversations.length > take) {
      const last = conversations.pop();
      if (last) nextCursor = last.id;
    }

    // 2) Último mensaje + unread_count (MVP N+1)
    const items = await Promise.all(
      conversations.map(async (c) => {
        const lastMsg = await prisma.messaging_message.findFirst({
          where: { conversation_id: c.id },
          orderBy: [
            { provider_ts: "desc" },
            { created_at: "desc" },
          ],
          select: {
            direction: true,
            kind: true,
            text: true,
            status: true,
            provider_ts: true,
            created_at: true,
          },
        });

        const unread_count = await prisma.messaging_message.count({
          where: {
            conversation_id: c.id,
            direction: "in",
            provider_ts: c.last_read_at
              ? { gt: c.last_read_at }
              : undefined,
          },
        });

        return {
          id: c.id,
          contact: {
            name: c.contact_name,
            phone_e164: c.contact_phone_e164 ?? c.contact_external_id,
            external_id: c.contact_external_id,
          },
          status: c.status,
          last_message_at: c.last_message_at,
          last_read_at: c.last_read_at,
          unread_count,
          last_message: lastMsg
            ? {
                direction: lastMsg.direction,
                text: lastMsg.text,
                kind: lastMsg.kind,
                status: lastMsg.status,
                at: lastMsg.provider_ts ?? lastMsg.created_at,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      items,
      nextCursor,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error al listar conversaciones" },
      { status: 500 }
    );
  }
}