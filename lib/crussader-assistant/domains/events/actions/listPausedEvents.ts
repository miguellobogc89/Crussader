// lib/crussader-assistant/actions/events/actions/listPausedEvents.ts

import { prisma } from "@/lib/prisma";

function asText(value: unknown) {
  return String(value || "").trim();
}

export async function listPausedEvents(args: {
  companyId: string;
  customerId: string;
}) {
  const companyId = asText(args.companyId);
  const customerId = asText(args.customerId);

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!customerId) {
    throw new Error("Missing customerId");
  }

  const events = await prisma.agent_event.findMany({
    where: {
      company_id: companyId,
      customer_id: customerId,
      status: "PAUSED"
    },
    orderBy: [
      { updated_at: "desc" },
      { created_at: "desc" }
    ],
    select: {
      id: true,
      type: true,
      product: true,
      title: true,
      status: true,
      local_time: true,
      days_of_week: true,
      run_at: true,
      next_run_at: true,
      conversation_id: true,
      meta: true
    }
  });

  return {
    kind: "PAUSED_EVENTS_LIST" as const,
    count: events.length,
    events
  };
}