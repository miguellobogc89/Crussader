// lib/crussader-assistant/actions/events/actions/listEvents.ts

import { prisma } from "@/lib/prisma";

function asText(value: unknown) {
  return String(value || "").trim();
}

export async function listEvents(args: {
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
      status: "ACTIVE",
      is_active: true
    },
    orderBy: {
      created_at: "desc"
    },
    select: {
      id: true,
      type: true,
      product: true,
      title: true,
      local_time: true,
      days_of_week: true,
      status: true,
      run_at: true,
      next_run_at: true,
      conversation_id: true,
      meta: true,
      created_at: true
    },
    take: 20
  });

  return {
    kind: "LIST" as const,
    events
  };
}