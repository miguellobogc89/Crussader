// lib/crussader-assistant/actions/events/listAssistantEvents.ts
import { prisma } from "@/lib/prisma";

function asText(v: unknown) {
  return String(v || "").trim();
}

export async function listAssistantEvents(args: {
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
      status: {
        in: ["ACTIVE", "PAUSED"],
      },
    },
    orderBy: {
      created_at: "desc",
    },
    select: {
      id: true,
      type: true,
      title: true,
      local_time: true,
      days_of_week: true,
      status: true,
      next_run_at: true,
    },
    take: 20,
  });

  return {
    kind: "LIST",
    events,
  };
}