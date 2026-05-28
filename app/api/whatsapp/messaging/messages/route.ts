// app/api/whatsapp/messaging/messages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMessagingMessage } from "@/lib/whatsapp/normalizers/normalizeMessagingMessage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const companyId = String(searchParams.get("companyId") || "").trim();
    const conversationId = String(searchParams.get("conversationId") || "").trim();

    if (!companyId || !conversationId) {
      return NextResponse.json(
        { ok: false, error: "companyId y conversationId requeridos" },
        { status: 400 },
      );
    }

    const rawLimit = Number(searchParams.get("limit") || 200);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 500)
      : 200;

    const conversation = await prisma.messaging_conversation.findFirst({
      where: {
        id: conversationId,
        integration_installation: {
          company_id: companyId,
          provider: "whatsapp",
        },
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found for company" },
        { status: 404 },
      );
    }

    const dbMessages = await prisma.messaging_message.findMany({
      where: {
        conversation_id: conversation.id,
      },
      orderBy: [{ provider_ts: "asc" }, { created_at: "asc" }],
      take: limit,
      select: {
        id: true,
        direction: true,
        kind: true,
        provider_message_id: true,
        text: true,
        status: true,
        provider_ts: true,
        created_at: true,
        payload: true,
      },
    });

    const templateNames = Array.from(
      new Set(
        dbMessages
          .map((message) => {
            const payload = message.payload as any;

            if (typeof payload?.templateName !== "string") {
              return "";
            }

            return payload.templateName.trim();
          })
          .filter(Boolean),
      ),
    );

    const templates =
      templateNames.length > 0
        ? await prisma.whatsapp_template.findMany({
            where: {
              company_id: companyId,
              template_name: {
                in: templateNames,
              },
            },
            select: {
              template_name: true,
              body_preview: true,
            },
          })
        : [];

    const templateByName = new Map(
      templates.map((template) => [
        template.template_name,
        template.body_preview ?? "",
      ]),
    );

    const messages = dbMessages.map((message) => {
      const payload = message.payload as any;
      const templateName =
        typeof payload?.templateName === "string" ? payload.templateName : "";

      const normalized = normalizeMessagingMessage({
        message,
        templateBodyPreview:
          message.kind === "template"
            ? templateByName.get(templateName) ?? ""
            : null,
      });

      const messageDate = message.provider_ts ?? message.created_at;

      return {
        id: message.id,
        at: messageDate.toISOString(),
        direction: normalized.direction,
        kind: normalized.kind,
        displayText: normalized.displayText,
        status: normalized.status,
        payload: normalized.payload,
      };
    });

    return NextResponse.json({
      ok: true,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Error al listar mensajes" },
      { status: 500 },
    );
  }
}