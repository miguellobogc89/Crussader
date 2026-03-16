// lib/crussader-assistant/actions/events/actions/updateEvent.ts

import { prisma } from "@/lib/prisma";
import { findEvent } from "./findEvent";

type EventType = "REMINDER" | "DELIVERY" | "ALERT" | "CAMPAIGN";

function asText(value: unknown) {
  return String(value || "").trim();
}

export async function updateEvent(args: {
  companyId: string;
  customerId: string;
  eventId: string;
  type?: EventType;
  product?: string;
  contentKey?: string;
  title?: string;
  prompt?: string;
  localTime?: Date | null;
  daysOfWeek?: number[];
  runAt?: Date | null;
  nextRunAt?: Date | null;
  timezone?: string | null;
  status?: "ACTIVE" | "PAUSED" | "CANCELLED";
  conversationId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const companyId = asText(args.companyId);
  const customerId = asText(args.customerId);
  const eventId = asText(args.eventId);
  const title = asText(args.title);
  const prompt = asText(args.prompt);
  const product = asText(args.product);
  const contentKey = asText(args.contentKey);

  let timezone = asText(args.timezone);
  if (!timezone) {
    timezone = "Europe/Madrid";
  }

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!customerId) {
    throw new Error("Missing customerId");
  }

  if (!eventId) {
    throw new Error("Missing eventId");
  }

  const existing = await findEvent({
    companyId,
    customerId,
    eventId,
    status: "ANY"
  });

  if (!existing) {
    throw new Error("Event not found");
  }

  let nextMeta: Record<string, unknown> = {};

  if (existing.meta && typeof existing.meta === "object" && !Array.isArray(existing.meta)) {
    nextMeta = { ...(existing.meta as Record<string, unknown>) };
  }

  if (contentKey) {
    nextMeta.contentKey = contentKey;
  }

  if (args.meta) {
    nextMeta = {
      ...nextMeta,
      ...args.meta
    };
  }

  const data: {
    type?: EventType;
    product?: string | null;
    title?: string;
    prompt?: string;
    timezone?: string;
    local_time?: Date | null;
    days_of_week?: number[];
    run_at?: Date | null;
    next_run_at?: Date | null;
    status?: "ACTIVE" | "PAUSED" | "CANCELLED";
    is_active?: boolean;
    conversation_id?: string | null;
    meta?: Record<string, unknown>;
  } = {};

  if (args.type) {
    data.type = args.type;
  }

  if (product) {
    data.product = product;
  }

  if (title) {
    data.title = title;
  }

  if (prompt) {
    data.prompt = prompt;
  }

  data.timezone = timezone;

  if (args.localTime !== undefined) {
    data.local_time = args.localTime;
  }

  if (args.daysOfWeek !== undefined) {
    data.days_of_week = args.daysOfWeek;
  }

  if (args.runAt !== undefined) {
    data.run_at = args.runAt;
  }

  if (args.nextRunAt !== undefined) {
    data.next_run_at = args.nextRunAt;
  }

  if (args.status) {
    data.status = args.status;

    if (args.status === "ACTIVE") {
      data.is_active = true;
    }

    if (args.status !== "ACTIVE") {
      data.is_active = false;
    }
  }

  if (args.conversationId !== undefined) {
    data.conversation_id = args.conversationId;
  }

  data.meta = nextMeta;

  const updated = await prisma.agent_event.update({
    where: {
      id: existing.id
    },
    data,
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
    kind: "UPDATED" as const,
    event: updated
  };
}