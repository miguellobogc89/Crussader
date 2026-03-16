// app/api/cron/agent-event-executor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAssistantWhatsAppMessage } from "@/lib/crussader-assistant/legacy/bridges/chat/sendAssistantWhatsAppMessage";
import { resolveItemTemplateVariables } from "@/lib/crussader-assistant/catalogs/items/resolveItemTemplateVariables";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_AGENT_EVENTS_SECRET;
  const auth = req.headers.get("authorization") ?? "";

  if (secret && auth === `Bearer ${secret}`) {
    return true;
  }

  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();

  if (ua.includes("vercel-cron")) {
    return true;
  }

  return false;
}

function asText(value: unknown) {
  return String(value || "").trim();
}

async function generateEventContent(prompt: string | null) {
  if (!prompt) {
    return "Hola. Este es un mensaje automático del asistente Crussader.";
  }

  return prompt;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const runs = await prisma.$queryRaw<any[]>`
    UPDATE agent_event_run
    SET status = 'RUNNING',
        started_at = NOW()
    WHERE id IN (
      SELECT id
      FROM agent_event_run
      WHERE status = 'PENDING'
      AND scheduled_for <= NOW()
      ORDER BY scheduled_for
      LIMIT 50
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
  `;

  let processed = 0;
  let success = 0;
  let failed = 0;

  for (const run of runs) {
    processed += 1;

    try {
      const event = await prisma.agent_event.findUnique({
        where: { id: run.event_id },
        include: {
          agent_cat_item: true,
        },
      });

      if (!event) {
        throw new Error("event not found");
      }

      const conversationId = asText(event.conversation_id);

      if (!conversationId) {
        throw new Error("missing conversation_id");
      }

      const itemId = asText(event.item_id);
      const itemKey = asText(event.agent_cat_item?.key);
      const itemTemplateName = asText(event.agent_cat_item?.whatsapp_template_name);
      const itemTemplateLanguage = asText(event.agent_cat_item?.whatsapp_template_language);
      const itemTemplateVariables = event.agent_cat_item?.whatsapp_template_variables ?? [];

      const body = await generateEventContent(event.prompt);

      let sendResult: {
        ok: boolean;
        providerMessageId: string | null;
        raw: unknown;
      };

      let storedText = body;

      if (itemId) {
        if (!event.agent_cat_item) {
          throw new Error("item not found for event");
        }

        if (!itemTemplateName) {
          throw new Error("item without whatsapp_template_name");
        }

        if (!itemTemplateLanguage) {
          throw new Error("item without whatsapp_template_language");
        }

        const resolvedTemplate = await resolveItemTemplateVariables({
          itemKey,
          templateVariables: itemTemplateVariables,
        });

        sendResult = await sendAssistantWhatsAppMessage({
          conversationId,
          template: {
            name: itemTemplateName,
            language: itemTemplateLanguage,
            components: resolvedTemplate.components,
          },
        });

        storedText = `[item:${itemKey}] [template] ${itemTemplateName} (${itemTemplateLanguage})`;

        await prisma.agent_event_run.update({
          where: { id: run.id },
          data: {
            template_name: itemTemplateName,
            template_variables: resolvedTemplate.valuesByName,
          },
        });
      } else {
        sendResult = await sendAssistantWhatsAppMessage({
          conversationId,
          text: body,
        });
      }

      await prisma.agent_event_run.update({
        where: { id: run.id },
        data: {
          status: "SUCCESS",
          generated_text: storedText,
          provider_message_id: sendResult.providerMessageId,
          finished_at: new Date(),
          payload: sendResult.raw ?? {},
        },
      });

      success += 1;
    } catch (error: unknown) {
      let errorMessage = "error";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      await prisma.agent_event_run.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          error_message: errorMessage,
          finished_at: new Date(),
        },
      });

      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    success,
    failed,
  });
}