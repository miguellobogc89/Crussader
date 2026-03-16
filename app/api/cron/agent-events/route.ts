// app/api/cron/agent-events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAssistantWhatsAppMessage } from "@/lib/crussader-assistant/legacy/bridges/chat/sendAssistantWhatsAppMessage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function generateEventContent(prompt: string | null) {
  if (!prompt) {
    return "Hola. Este es un mensaje automático del asistente Crussader.";
  }

  return prompt;
}

function calculateNextRun(event: {
  local_time: Date | string;
  days_of_week: number[];
}) {
  const now = new Date();

  const timeValue = new Date(event.local_time);
  const hour = timeValue.getHours();
  const minute = timeValue.getMinutes();

  const allowedDays = Array.isArray(event.days_of_week) ? event.days_of_week : [];

  const next = new Date(now);

  next.setSeconds(0);
  next.setMilliseconds(0);

  for (let i = 0; i < 8; i++) {
    if (i > 0) next.setDate(next.getDate() + 1);

    const day = next.getDay();

    if (!allowedDays.includes(day)) continue;

    next.setHours(hour);
    next.setMinutes(minute);

    if (i === 0 && next <= now) continue;

    return next;
  }

  const fallback = new Date(now);

  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(hour);
  fallback.setMinutes(minute);

  return fallback;
}

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_AGENT_EVENTS_SECRET;

  const auth = req.headers.get("authorization") ?? "";

  if (secret && auth === `Bearer ${secret}`) return true;

  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();

  if (ua.includes("vercel-cron")) return true;

  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date();

  /*
  CLAIM DE EVENTOS
  */

  const events = await prisma.$queryRaw<
    any[]
  >`
UPDATE agent_event
SET claimed_until = NOW() + INTERVAL '30 seconds'
WHERE id IN (
    SELECT id
    FROM agent_event
    WHERE
        is_active = true
        AND status = 'ACTIVE'
        AND next_run_at <= NOW()
        AND (claimed_until IS NULL OR claimed_until < NOW())
    ORDER BY next_run_at
    LIMIT 50
)
RETURNING *;
`;

  console.log("[cron] events claimed", events.length);

  let processed = 0;
  let success = 0;
  let failed = 0;

  for (const event of events) {
    processed++;

    const scheduledFor = event.next_run_at ?? new Date();

    const run = await prisma.agent_event_run.create({
      data: {
        event_id: event.id,
        scheduled_for: scheduledFor,
        status: "RUNNING",
      },
    });

    try {
      const text = await generateEventContent(event.prompt);

      if (!event.conversation_id) {
        throw new Error("Missing conversation_id");
      }

      const sendResult = await sendAssistantWhatsAppMessage({
        conversationId: event.conversation_id,
        text,
      });

      const nextRun =
        event.local_time !== null
          ? calculateNextRun({
              local_time: event.local_time,
              days_of_week: event.days_of_week,
            })
          : null;

      await prisma.agent_event_run.update({
        where: { id: run.id },
        data: {
          status: "SUCCESS",
          generated_text: text,
          provider_message_id: sendResult.providerMessageId,
          finished_at: new Date(),
        },
      });

      await prisma.agent_event.update({
        where: { id: event.id },
        data: {
          last_run_at: now,
          next_run_at: nextRun,
          is_active: nextRun !== null,
          claimed_until: null,
        },
      });

      success++;
    } catch (err) {
      let message = "Unknown error";

      if (err instanceof Error) message = err.message;

      await prisma.agent_event_run.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          error_message: message,
          finished_at: new Date(),
        },
      });

      await prisma.agent_event.update({
        where: { id: event.id },
        data: {
          claimed_until: null,
        },
      });

      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    success,
    failed,
  });
}