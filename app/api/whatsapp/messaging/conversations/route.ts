// app/api/whatsapp/messaging/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const companyId = String(searchParams.get("companyId") || "").trim();
    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId requerido" },
        { status: 400 }
      );
    }

    const metaPhoneNumberId = String(searchParams.get("phoneNumberId") || "").trim();
    const take = Math.min(Number(searchParams.get("limit") || 30), 100);
    const cursor = String(searchParams.get("cursor") || "").trim();

    const installs = await prisma.integration_installation.findMany({
      where: {
        company_id: companyId,
        provider: "whatsapp",
        status: "active",
      },
      select: { id: true },
    });

    const installIds = installs.map((x) => x.id);

    if (installIds.length === 0) {
      return NextResponse.json({ ok: true, items: [], nextCursor: null });
    }

    let companyPhoneNumberUuid: string | null = null;

    if (metaPhoneNumberId) {
      const phoneRow = await prisma.company_phone_number.findFirst({
        where: {
          company_id: companyId,
          phone_number_id: metaPhoneNumberId,
        },
        select: { id: true },
      });

      if (!phoneRow) {
        return NextResponse.json({ ok: true, items: [], nextCursor: null });
      }

      companyPhoneNumberUuid = phoneRow.id;
    }

    const whereConv: {
      installation_id: { in: string[] };
      company_phone_number_id?: string;
    } = {
      installation_id: { in: installIds },
    };

    if (companyPhoneNumberUuid) {
      whereConv.company_phone_number_id = companyPhoneNumberUuid;
    }

    const conversations = await prisma.messaging_conversation.findMany({
      where: whereConv,
      orderBy: [{ last_message_at: "desc" }, { created_at: "desc" }],
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

    const items = await Promise.all(
      conversations.map(async (c) => {
        const lastMsg = await prisma.messaging_message.findFirst({
          where: { conversation_id: c.id },
          orderBy: [{ provider_ts: "desc" }, { created_at: "desc" }],
          select: {
            direction: true,
            kind: true,
            text: true,
            status: true,
            provider_ts: true,
            created_at: true,
          },
        });

        const unreadCount = await prisma.messaging_message.count({
          where: {
            conversation_id: c.id,
            direction: "in",
            ...(c.last_read_at ? { provider_ts: { gt: c.last_read_at } } : {}),
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
          unread_count: unreadCount,
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

    return NextResponse.json({ ok: true, items, nextCursor });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error al listar conversaciones" },
      { status: 500 }
    );
  }
}