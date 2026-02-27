// app/api/integrations/meta/whatsapp/ai-reply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildWhatsappAssistantReply } from "@/lib/ai/whatsappAssistant";
import { executeAgentAction } from "@/lib/agents/executor";
import { AgentActionSchema } from "@/lib/agents/contract";
import { z } from "zod";

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

function resolveToNumber(conversation: {
  contact_phone_e164: string | null;
  contact_external_id: string;
}) {
  const phone = conversation.contact_phone_e164;
  if (phone && phone.trim()) {
    return normalizePhone(phone);
  }
  return normalizePhone(conversation.contact_external_id);
}

const BodySchema = z.object({
  conversationId: z.string().min(1),
  text: z.string().min(1),
});

const UuidSchema = z.string().uuid();

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const debugEnabled = url.searchParams.get("debug") === "1";

    // Env vars en runtime
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { ok: false, error: "Missing WhatsApp env vars" },
        { status: 500 }
      );
    }

    const bodyRaw = await req.json().catch(() => null);
    const bodyParsed = BodySchema.safeParse(bodyRaw);

    if (!bodyParsed.success) {
      return NextResponse.json(
        { ok: false, error: "Missing conversationId or text" },
        { status: 400 }
      );
    }

    const conversationId = bodyParsed.data.conversationId.trim();
    const text = bodyParsed.data.text.trim();

    if (!UuidSchema.safeParse(conversationId).success) {
      return NextResponse.json(
        { ok: false, error: "Invalid conversationId (expected UUID)" },
        { status: 400 }
      );
    }

    const conversation = await prisma.messaging_conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        installation_id: true,
        contact_external_id: true,
        contact_phone_e164: true,
        contact_name: true,
        last_message_at: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // 1) Planner (IA): devuelve botText provisional + actions[] + needs[]
    const built = await buildWhatsappAssistantReply({
      installationId: conversation.installation_id,
      text,
      contactName: conversation.contact_name,
      lastConversationAt: conversation.last_message_at,
    });

    // 2) Ejecuta plan (backend) si hay acciones válidas
    const companyId = built?.debug?.companyId ?? null;

    const execResults: any[] = [];
    const actionsRaw = Array.isArray((built as any)?.actions) ? (built as any).actions : [];

    for (const a of actionsRaw) {
      const parsed = AgentActionSchema.safeParse(a);
      if (!parsed.success) continue;

      const res = await executeAgentAction(
        {
          agentKey: "whatsapp",
          companyId: companyId ?? "",
          conversationId: conversation.id,
          customerPhoneE164: conversation.contact_phone_e164 ?? undefined,
          action: parsed.data,
        },
        { debug: debugEnabled, requestId: conversation.id }
      );

      execResults.push(res);
    }

    // Compat: si solo hay 1, devolvemos objeto; si no, array; si none, null
    const actionExecResult: any =
      execResults.length === 0 ? null : execResults.length === 1 ? execResults[0] : execResults;

    // 3) Por ahora seguimos enviando el botText provisional del planner.
    // (En el siguiente paso haremos "respond()" usando execResults.)
    const botText = built.botText;
    const to = resolveToNumber(conversation);

    const payloadToMeta = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: botText },
    };

    const res = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadToMeta),
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      await prisma.messaging_message.create({
        data: {
          conversation_id: conversation.id,
          provider_message_id: null,
          direction: "out",
          kind: "text",
          text: botText,
          status: "failed",
          provider_ts: new Date(),
          payload: (data ?? {}) as any,
        },
      });

      return NextResponse.json(
        { ok: false, error: "Meta rejected the request", meta_error: data },
        { status: 400 }
      );
    }

    let providerMessageId: string | null = null;
    if (data && data.messages && data.messages[0] && data.messages[0].id) {
      providerMessageId = String(data.messages[0].id);
    }

    await prisma.messaging_conversation.update({
      where: { id: conversation.id },
      data: {
        last_message_at: new Date(),
        updated_at: new Date(),
      },
    });

    await prisma.messaging_message.create({
      data: {
        conversation_id: conversation.id,
        provider_message_id: providerMessageId,
        direction: "out",
        kind: "text",
        text: botText,
        status: "sent",
        provider_ts: new Date(),
        payload: (data ?? {}) as any,
      },
    });

    return NextResponse.json({
      ok: true,
      botText,
      meta: data,
      debug: debugEnabled
        ? {
            conversationId: conversation.id,
            providerMessageId,
            companyId: built.debug.companyId,
            knowledgeUsed: built.debug.knowledgeUsed,
            needs: (built as any)?.needs ?? [],
            plannedActionsCount: actionsRaw.length,
            actionExecResult,
            understanding: (built as any)?.understanding ?? null,
            plannedActions: Array.isArray((built as any)?.actions) ? (built as any).actions : [],
            rawNeeds: Array.isArray((built as any)?.needs) ? (built as any).needs : [],
          }
        : undefined,
    });
  } catch (e) {
    console.error("[WA ai-reply] error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}