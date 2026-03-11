// app/api/cron/agent-events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAssistantWhatsAppMessage } from "@/lib/crussader-assistant/chat/sendAssistantWhatsAppMessage";

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
  timezone: string | null;
}) {
  const now = new Date();

  const timeValue = new Date(event.local_time);
  const targetHour = timeValue.getHours();
  const targetMinute = timeValue.getMinutes();

  const allowedDays = Array.isArray(event.days_of_week) ? event.days_of_week : [];
  const next = new Date(now);

  next.setSeconds(0);
  next.setMilliseconds(0);

  for (let i = 0; i < 8; i += 1) {
    if (i > 0) {
      next.setDate(next.getDate() + 1);
    }

    const day = next.getDay();
    const isAllowedDay = allowedDays.includes(day);

    if (!isAllowedDay) {
      continue;
    }

    next.setHours(targetHour);
    next.setMinutes(targetMinute);

    if (i === 0) {
      if (next.getTime() <= now.getTime()) {
        continue;
      }
    }

    return next;
  }

  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(targetHour);
  fallback.setMinutes(targetMinute);
  fallback.setSeconds(0);
  fallback.setMilliseconds(0);

  return fallback;
}

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_AGENT_EVENTS_SECRET;
  const auth = req.headers.get("authorization") ?? "";

  if (secret) {
    if (auth === `Bearer ${secret}`) {
      return true;
    }
  }

  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();
  if (ua.includes("vercel-cron")) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  console.log("[agent-events cron] node now", now.toISOString());

  const dbNowRow = await prisma.$queryRaw<Array<{ now: Date }>>`
    select now() as now
  `;

  console.log("[agent-events cron] db now", dbNowRow[0]?.now);


  const events = await prisma.agent_event.findMany({
    where: {
      is_active: true,
      status: "ACTIVE",
      next_run_at: {
        lte: now,
      },
    },
    orderBy: {
      next_run_at: "asc",
    },
    take: 50,
  });

  console.log("[agent-events cron] events found", events.length);

  let processed = 0;
  let success = 0;
  let failed = 0;

  for (const event of events) {
    processed += 1;

    const scheduledFor = event.next_run_at ? new Date(event.next_run_at) : new Date();

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
  throw new Error("Event without conversation_id");
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
              timezone: event.timezone,
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
  },
});
      success += 1;
    } catch (error) {
      let errorMessage = "Unknown error";

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