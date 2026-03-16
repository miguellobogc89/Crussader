    // app/api/cron/agent-event-scheduler/route.ts
    import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_AGENT_EVENTS_SECRET;
  const auth = req.headers.get("authorization") ?? "";

  if (secret && auth === `Bearer ${secret}`) return true;

  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();
  if (ua.includes("vercel-cron")) return true;

  return false;
}

function calculateNextRun(event: {
  local_time: Date | string;
  days_of_week: number[];
}) {
  const now = new Date();

  const timeValue = new Date(event.local_time);
  const hour = timeValue.getHours();
  const minute = timeValue.getMinutes();

  const next = new Date(now);

  for (let i = 0; i < 8; i++) {
    if (i > 0) next.setDate(next.getDate() + 1);

    const day = next.getDay();

    if (!event.days_of_week.includes(day)) continue;

    next.setHours(hour);
    next.setMinutes(minute);
    next.setSeconds(0);
    next.setMilliseconds(0);

    if (i === 0 && next <= now) continue;

    return next;
  }

  return null;
}

export async function GET(req: NextRequest) {

  if (!isAuthorized(req)) {
    return NextResponse.json({ ok:false }, { status:401 });
  }

  const now = new Date();

  const events = await prisma.agent_event.findMany({
    where: {
      is_active: true,
      status: "ACTIVE",
      next_run_at: { lte: now }
    },
    orderBy: { next_run_at: "asc" },
    take: 50
  });

  let createdRuns = 0;

  for (const event of events) {

    const scheduledFor = event.next_run_at ?? now;

    await prisma.agent_event_run.create({
      data: {
        event_id: event.id,
        scheduled_for: scheduledFor,
        status: "PENDING"
      }
    });

    const nextRun =
      event.local_time !== null
        ? calculateNextRun({
            local_time: event.local_time,
            days_of_week: event.days_of_week
          })
        : null;

    await prisma.agent_event.update({
      where: { id: event.id },
      data: {
        last_run_at: now,
        next_run_at: nextRun,
        is_active: nextRun !== null
      }
    });

    createdRuns++;
  }

  return NextResponse.json({
    ok: true,
    createdRuns
  });
}