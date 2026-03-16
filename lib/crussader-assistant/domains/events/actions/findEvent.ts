// lib/crussader-assistant/actions/events/actions/findEvent.ts

import { prisma } from "@/lib/prisma";

function asText(value: unknown) {
  return String(value || "").trim();
}

type EventType = "REMINDER" | "DELIVERY" | "ALERT" | "CAMPAIGN";
type EventStatus = "ACTIVE" | "PAUSED" | "CANCELLED" | "ANY";

export async function findEvent(args: {
  companyId: string;
  customerId: string;
  eventId?: string;
  type?: EventType;
  product?: string;
  title?: string;
  contentKey?: string;
  status?: EventStatus;
}) {
  const companyId = asText(args.companyId);
  const customerId = asText(args.customerId);
  const eventId = asText(args.eventId);
  const title = asText(args.title);
  const product = asText(args.product);
  const contentKey = asText(args.contentKey);

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!customerId) {
    throw new Error("Missing customerId");
  }

  const where: any = {
    company_id: companyId,
    customer_id: customerId
  };

  if (eventId) {
    where.id = eventId;
  }

  if (!eventId && args.type) {
    where.type = args.type;
  }

  if (product) {
    where.product = product;
  }

  if (title) {
    where.title = title;
  }

  if (contentKey) {
    where.meta = {
      path: ["contentKey"],
      equals: contentKey
    };
  }

  let status = "ANY";
  if (args.status) {
    status = args.status;
  }

  if (status !== "ANY") {
    where.status = status;
  }

  const event = await prisma.agent_event.findFirst({
    where,
    orderBy: {
      created_at: "desc"
    }
  });

  return event;
}