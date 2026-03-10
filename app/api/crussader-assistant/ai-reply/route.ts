// app/api/crussader-assistant/ai-reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assistantPipeline } from "@/lib/crussader-assistant/orchestrator/assistantPipeline";
import { sendAssistantWhatsAppMessage } from "@/lib/crussader-assistant/chat/sendAssistantWhatsAppMessage";

export const dynamic = "force-dynamic";

function asText(v: unknown) {
  return String(v || "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const conversationId = asText(body.conversationId);
    const text = asText(body.text);

    if (!conversationId || !text) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

const conversation = await prisma.messaging_conversation.findUnique({
  where: { id: conversationId },
  select: {
    id: true,
    installation_id: true,
    contact_phone_e164: true,
    customer_id: true,
    company_phone_number: {
      select: {
        phone_number_id: true,
      },
    },
  },
});

    if (!conversation) {
      return NextResponse.json({ ok: false, error: "conversation_not_found" });
    }

    const installation = await prisma.integration_installation.findUnique({
      where: { id: conversation.installation_id },
      select: {
        id: true,
        company_id: true,
      },
    });

    if (!installation) {
      return NextResponse.json({ ok: false, error: "installation_not_found" });
    }

    const companyId = installation.company_id;

    const agent = await prisma.agent.findFirst({
      where: { companyId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ ok: false, error: "agent_not_found" });
    }

    if (!conversation.customer_id) {
      return NextResponse.json({ ok: false, error: "customer_not_resolved" }, { status: 400 });
    }

const customerId = conversation.customer_id;
    const result = await assistantPipeline({
      companyId,
      agentId: agent.id,
      conversationId: conversation.id,
      caller: conversation.contact_phone_e164 || "",
      callee: conversation.company_phone_number?.phone_number_id || "",
      incomingText: text,
      environment: "PROD",
      language: "es",
      customerId,
    });

    const botText = asText(result.botText);

    if (botText) {
      await sendAssistantWhatsAppMessage({
        conversationId,
        text: botText,
      });
    }

    return NextResponse.json({
      ok: true,
      botText,
    });
  } catch (e) {
    console.error("[assistant ai-reply]", e);
    return NextResponse.json({ ok: false });
  }
}