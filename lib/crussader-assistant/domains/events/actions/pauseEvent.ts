// lib/crussader-assistant/actions/events/actions/pauseEvent.ts

import { prisma } from "@/lib/prisma";
import { findEvent } from "./findEvent";

function asText(value: unknown) {
  return String(value || "").trim();
}

type EventType = "REMINDER" | "DELIVERY" | "ALERT" | "CAMPAIGN";

export async function pauseEvent(args: {
  companyId: string;
  customerId: string;
  eventId?: string;
  type?: EventType;
  product?: string;
  contentKey?: string;
}) {
  const companyId = asText(args.companyId);
  const customerId = asText(args.customerId);
  const eventId = asText(args.eventId);
  const product = asText(args.product);
  const contentKey = asText(args.contentKey);

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!customerId) {
    throw new Error("Missing customerId");
  }

  if (!eventId && !args.type && !product && !contentKey) {
    throw new Error("Missing eventId or type or product or contentKey");
  }

  const existing = await findEvent({
    companyId,
    customerId,
    eventId,
    type: args.type,
    product,
    contentKey,
    status: "ANY"
  });

  if (!existing) {
    throw new Error("Event not found");
  }

  const updated = await prisma.agent_event.update({
    where: { id: existing.id },
    data: {
      status: "PAUSED",
      is_active: false
    },
    select: {
      id: true,
      title: true,
      type: true,
      product: true,
      status: true,
      meta: true
    }
  });

  return {
    kind: "PAUSED" as const,
    event: updated
  };
}