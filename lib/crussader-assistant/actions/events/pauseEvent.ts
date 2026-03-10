// lib/crussader-assistant/actions/events/pauseEvent.ts

import { prisma } from "@/lib/prisma";

function asText(v: unknown) {
  return String(v || "").trim();
}

export async function pauseEvent(args: {
  companyId: string;
  customerId: string;
  eventId?: string;
  type?: "GOSPEL" | "NEWS" | "REMINDER" | "CUSTOM";
}) {
  const companyId = asText(args.companyId);
  const customerId = asText(args.customerId);
  const eventId = asText(args.eventId);

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!customerId) {
    throw new Error("Missing customerId");
  }

  if (!eventId && !args.type) {
    throw new Error("Missing eventId or type");
  }

  const existing = await prisma.agent_event.findFirst({
    where: {
      company_id: companyId,
      customer_id: customerId,
      ...(eventId
        ? { id: eventId }
        : {
            type: args.type,
            status: { in: ["ACTIVE", "PAUSED"] },
          }),
    },
    orderBy: {
      created_at: "desc",
    },
    select: {
      id: true,
      title: true,
      status: true,
      type: true,
    },
  });

  if (!existing) {
    throw new Error("Event not found");
  }

  const updated = await prisma.agent_event.update({
    where: { id: existing.id },
    data: {
      status: "PAUSED",
      is_active: false,
    },
    select: {
      id: true,
      title: true,
      status: true,
      type: true,
    },
  });

  return {
    kind: "PAUSED" as const,
    event: updated,
  };
}