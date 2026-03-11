// app/api/integrations/meta/whatsapp/ai-reply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { whatsappPipeline } from "@/lib/agents/orchestrator/whatsappPipeline";

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

function resolveToNumber(conversation: {
  contact_phone_e164: string | null;
  contact_external_id: string;
}) {
  const phone = conversation.contact_phone_e164;
  if (phone && phone.trim()) return normalizePhone(phone);
  return normalizePhone(conversation.contact_external_id);
}

const BodySchema = z.object({
  conversationId: z.string().min(1),
  text: z.string().min(1),
});

const UuidSchema = z.string().uuid();

async function sendWhatsappText(args: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  body: string;
}) {
  const { accessToken, phoneNumberId, to, body } = args;

  const payloadToMeta = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
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
  return { ok: res.ok, status: res.status, data };
}

function extractProviderMessageId(metaData: any): string | null {
  if (!metaData) return null;
  const id = metaData?.messages?.[0]?.id;
  if (typeof id !== "string") return null;
  const s = id.trim();
  if (!s) return null;
  return s;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const debugEnabled = url.searchParams.get("debug") === "1";

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
    const incomingText = bodyParsed.data.text.trim();

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
        customer_id: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    const to = resolveToNumber(conversation);

    const installation = await prisma.integration_installation.findUnique({
      where: { id: conversation.installation_id },
      select: { company_id: true },
    });

    const companyId = installation?.company_id;
    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "Missing companyId for installation" },
        { status: 500 }
      );
    }

    // Agent activo
    const agent = await prisma.agent.findFirst({
      where: { companyId, channel: "WHATSAPP", status: "ACTIVE" },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json(
        { ok: false, error: "No ACTIVE WHATSAPP agent for this company" },
        { status: 500 }
      );
    }

    // Orchestrator (toda la lógica de negocio va dentro)
    const result = await whatsappPipeline({
      companyId,
      agentId: agent.id,
      conversationId: conversation.id,
      toPhoneE164: to,
      phoneNumberId,
      incomingText,
      environment: "TEST",
      language: "es",
      contactName: conversation.contact_name ?? null,
      installationId: conversation.installation_id,
    });

    const botText = result.botText;

    // Send WhatsApp + persist OUT
    const metaSend = await sendWhatsappText({
      accessToken,
      phoneNumberId,
      to,
      body: botText,
    });

    await prisma.messaging_conversation.update({
      where: { id: conversation.id },
      data: { last_message_at: new Date(), updated_at: new Date() },
    });

    await prisma.messaging_message.create({
      data: {
        conversation_id: conversation.id,
        provider_message_id: extractProviderMessageId(metaSend.data),
        direction: "out",
        kind: "text",
        text: botText,
        status: metaSend.ok ? "sent" : "failed",
        provider_ts: new Date(),
        payload: (metaSend.data ?? {}) as any,
      },
    });

    if (!metaSend.ok) {
      return NextResponse.json(
        { ok: false, error: "Meta rejected the request", meta_error: metaSend.data },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      botText,
      meta: metaSend.data,
      debug: debugEnabled
        ? {
            conversationId: conversation.id,
            companyId,
            agentId: agent.id,
            sessionId: result.sessionId,
            stage: result.stage,
            runtime: result.runtime,
            debug: result.debug,
          }
  : undefined,
    });
  } catch (e) {
    console.error("[WA ai-reply] error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}