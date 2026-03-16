// app/api/crussader-assistant/ai-reply/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAssistantWhatsAppMessage } from "@/lib/crussader-assistant/legacy/bridges/chat/sendAssistantWhatsAppMessage";
import { runAssistantIntake } from "@/lib/crussader-assistant/intake/runAssistantIntake";
import { assistantPipeline } from "@/lib/crussader-assistant/pipeline/assistantPipeline";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function asText(value: unknown) {
  return String(value || "").trim();
}

export async function POST(req: NextRequest) {
  const debugId = crypto.randomUUID();

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

    const intake = await runAssistantIntake({
      conversationId,
      rawUserText: text
    });

    let pipelineResult: any = null;

    if (intake.replyDecision.type === "TASK_READY") {
      const conversation = await prisma.messaging_conversation.findUnique({
        where: { id: conversationId },
        select: {
          customer_id: true,
          installation_id: true,
          integration_installation: {
            select: {
              company_id: true
            }
          },
          Customer: {
            select: {
              createdByAgentId: true
            }
          }
        }
      });

      if (!conversation?.integration_installation?.company_id) {
        throw new Error("Company not resolved for this conversation");
      }

      if (!conversation?.customer_id) {
        throw new Error("Customer not resolved for this conversation");
      }

      if (!conversation?.Customer?.createdByAgentId) {
        throw new Error("Agent not resolved for this conversation");
      }

      pipelineResult = await assistantPipeline({
        companyId: conversation.integration_installation.company_id,
        agentId: conversation.Customer.createdByAgentId,
        conversationId,
        caller: "debug-caller",
        callee: "debug-callee",
        incomingText: text,
        environment: process.env.NODE_ENV || "development",
        language: "es",
        customerId: conversation.customer_id
      });
      console.log("[ai-reply][pipelineResult]", pipelineResult);
    }

    const finalText = pipelineResult?.botText || intake.botText;

    if (finalText) {
      await sendAssistantWhatsAppMessage({
        conversationId,
        text: finalText
      });
    }

    return NextResponse.json({
      ok: true,
      botText: finalText,
      readyTask: intake.readyTask
    });
  } catch (error) {
    console.error("[assistant ai-reply] fatal", {
      debugId,
      error
    });

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}