// lib/crussader-assistant/domains/events/actions/createEvent.ts

import { prisma } from "@/lib/prisma";

type EventType = "REMINDER" | "DELIVERY" | "ALERT" | "CAMPAIGN";

function asText(value: unknown) {
  return String(value || "").trim();
}

function getStatus(value: unknown): "ACTIVE" | "PAUSED" | "CANCELLED" {
  const text = asText(value);

  if (text === "PAUSED") {
    return "PAUSED";
  }

  if (text === "CANCELLED") {
    return "CANCELLED";
  }

  return "ACTIVE";
}

export async function createEvent(args: {
  companyId: string;
  agentId: string;
  customerId: string;
  type: EventType;
  product?: string | null;
  contentKey: string;
  title: string;
  prompt: string;
  localTime?: Date | null;
  daysOfWeek?: number[];
  runAt?: Date | null;
  nextRunAt?: Date | null;
  timezone?: string | null;
  status?: "ACTIVE" | "PAUSED" | "CANCELLED";
  conversationId?: string | null;
  meta?: Record<string, unknown>;
}) {

  console.log("[createEvent] incoming args", args);

  const companyId = asText(args.companyId);
  const agentId = asText(args.agentId);
  const customerId = asText(args.customerId);
  const title = asText(args.title);
  const prompt = asText(args.prompt);
  const contentKey = asText(args.contentKey);
  const product = asText(args.product);
  const timezone = asText(args.timezone);

  let finalTimezone = "Europe/Madrid";
  if (timezone) {
    finalTimezone = timezone;
  }

  const status = getStatus(args.status);

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!agentId) {
    throw new Error("Missing agentId");
  }

  if (!customerId) {
    throw new Error("Missing customerId");
  }

  if (!args.type) {
    throw new Error("Missing type");
  }

  if (!contentKey) {
    throw new Error("Missing contentKey");
  }

  if (!title) {
    throw new Error("Missing title");
  }

  if (!prompt) {
    throw new Error("Missing prompt");
  }

  let isActive = false;

  if (status === "ACTIVE") {
    isActive = true;
  }

  if (!args.runAt && !args.localTime) {
    console.error("[createEvent] invalid schedule", {
      runAt: args.runAt,
      localTime: args.localTime,
      daysOfWeek: args.daysOfWeek
    });

    throw new Error("Invalid schedule: missing runAt or localTime");
  }

  if (args.runAt && !args.nextRunAt) {
    args.nextRunAt = args.runAt;
  }

  console.log("[createEvent] normalized schedule", {
    runAt: args.runAt,
    nextRunAt: args.nextRunAt,
    localTime: args.localTime,
    daysOfWeek: args.daysOfWeek
  });

  try {

    const created = await prisma.agent_event.create({
      data: {
        company_id: companyId,
        agent_id: agentId,
        customer_id: customerId,
        type: args.type,
        product: product || null,
        title,
        prompt,
        timezone: finalTimezone,
        local_time: args.localTime || null,
        days_of_week: args.daysOfWeek || [],
        run_at: args.runAt || null,
        next_run_at: args.nextRunAt || null,
        status,
        is_active: isActive,
        conversation_id: args.conversationId || null,
        meta: {
          contentKey,
          ...(args.meta || {})
        }
      },
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

    console.log("[createEvent] event created", created.id);

    return {
      kind: "CREATED" as const,
      event: created
    };

  } catch (error) {

    console.error("[createEvent] prisma create failed");

    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(error);
    }

    throw error;
  }
}