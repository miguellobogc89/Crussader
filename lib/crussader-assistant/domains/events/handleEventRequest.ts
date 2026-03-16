// lib/crussader-assistant/domains/events/handleEventRequest.ts

import { createEvent } from "../../domains/events/actions/createEvent";
import { listEvents } from "../../domains/events/actions/listEvents";
import { listPausedEvents } from "../../domains/events/actions/listPausedEvents";
import { pauseEvent } from "../../domains/events/actions/pauseEvent";
import { resumeEvent } from "../../domains/events/actions/resumeEvent";
import { updateEvent } from "../../domains/events/actions/updateEvent";
import { resolveTargetEvent } from "./resolveTargetEvent";

import {
  buildExecutionError,
  mapExecutionErrorToUserMessage,
  getTimezoneValue,
  getStatusValue,
  getDaysValue
} from "../../domains/events/helpers/eventRequestHelpers";

type AgentEventType = "REMINDER" | "DELIVERY" | "ALERT" | "CAMPAIGN";

type EventRequestAction =
  | "create"
  | "update"
  | "pause"
  | "resume"
  | "list"
  | "list_paused"
  | "auto";

type HandleEventRequestArgs = {
  companyId: string;
  agentId: string;
  customerId: string;
  conversationId?: string;
  request: {
    action: EventRequestAction;
    eventName?: string;
    type?: AgentEventType;
    eventId?: string;
    product?: string;
    contentKey?: string;
    title?: string;
    prompt?: string;
    localTime?: Date | null;
    runAt?: Date | null;
    nextRunAt?: Date | null;
    isOneTime?: boolean;
    daysOfWeek?: number[];
    timezone?: string | null;
    status?: "ACTIVE" | "PAUSED" | "CANCELLED";
  };
};

function asText(value: unknown) {
  return String(value || "").trim();
}

function normalizeEventType(value: unknown): AgentEventType | undefined {
  const text = asText(value).toUpperCase();

  if (text === "REMINDER") {
    return "REMINDER";
  }

  if (text === "DELIVERY") {
    return "DELIVERY";
  }

  if (text === "ALERT") {
    return "ALERT";
  }

  if (text === "CAMPAIGN") {
    return "CAMPAIGN";
  }

  return undefined;
}

export async function handleEventRequest(args: HandleEventRequestArgs) {
  const companyId = asText(args.companyId);
  const agentId = asText(args.agentId);
  const customerId = asText(args.customerId);
  const conversationId = asText(args.conversationId);
  const request = args.request;

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!agentId) {
    throw new Error("Missing agentId");
  }

  if (!customerId) {
    throw new Error("Missing customerId");
  }

  try {
    if (request.action === "list") {
      const result = await listEvents({ companyId, customerId });

      return {
        kind: "DONE" as const,
        action: "list",
        data: result
      };
    }

    if (request.action === "list_paused") {
      const result = await listPausedEvents({ companyId, customerId });

      return {
        kind: "DONE" as const,
        action: "list_paused",
        data: result
      };
    }

    if (request.action === "pause") {
      let resolvedEventId = asText(request.eventId);

      if (!resolvedEventId) {
        const resolved = await resolveTargetEvent({
          conversationId,
          eventName: asText(request.eventName)
        });

        if (resolved.kind === "FOUND_NONE") {
          return buildExecutionError(
            "No he encontrado ese recordatorio.",
            "EVENT_NOT_FOUND"
          );
        }

        if (resolved.kind === "FOUND_MANY") {
          return buildExecutionError(
            "He encontrado más de un recordatorio con ese nombre. Dime cuál quieres pausar.",
            "MULTIPLE_EVENTS_MATCH"
          );
        }

        if (!resolved.isActive) {
          return {
            kind: "DONE" as const,
            action: "pause",
            data: {
              message: "Ese recordatorio ya estaba pausado."
            }
          };
        }

        resolvedEventId = resolved.eventId;
      }

      const result = await pauseEvent({
        companyId,
        customerId,
        eventId: resolvedEventId,
        type: normalizeEventType(request.type),
        contentKey: asText(request.contentKey) || undefined
      });

      return {
        kind: "DONE" as const,
        action: "pause",
        data: result
      };
    }

    if (request.action === "resume") {
      let resolvedEventId = asText(request.eventId);

      if (!resolvedEventId) {
        const resolved = await resolveTargetEvent({
          conversationId,
          eventName: asText(request.eventName)
        });

        if (resolved.kind === "FOUND_NONE") {
          return buildExecutionError(
            "No he encontrado ese recordatorio.",
            "EVENT_NOT_FOUND"
          );
        }

        if (resolved.kind === "FOUND_MANY") {
          return buildExecutionError(
            "He encontrado más de un recordatorio con ese nombre. Dime cuál quieres reanudar.",
            "MULTIPLE_EVENTS_MATCH"
          );
        }

        if (resolved.isActive) {
          return {
            kind: "DONE" as const,
            action: "resume",
            data: {
              message: "Ese recordatorio ya estaba activo."
            }
          };
        }

        resolvedEventId = resolved.eventId;
      }

      const result = await resumeEvent({
        companyId,
        customerId,
        eventId: resolvedEventId,
        type: normalizeEventType(request.type),
        contentKey: asText(request.contentKey) || undefined
      });

      return {
        kind: "DONE" as const,
        action: "resume",
        data: result
      };
    }

    if (request.action === "update") {
      let resolvedEventId = asText(request.eventId);

      if (!resolvedEventId && asText(request.eventName)) {
        const resolved = await resolveTargetEvent({
          conversationId,
          eventName: asText(request.eventName)
        });

        if (resolved.kind === "FOUND_NONE") {
          return buildExecutionError(
            "No he encontrado ese recordatorio.",
            "EVENT_NOT_FOUND"
          );
        }

        if (resolved.kind === "FOUND_MANY") {
          return buildExecutionError(
            "He encontrado más de un recordatorio con ese nombre. Dime cuál quieres modificar.",
            "MULTIPLE_EVENTS_MATCH"
          );
        }

        resolvedEventId = resolved.eventId;
      }

      if (!resolvedEventId) {
        return buildExecutionError(
          "No sé qué recordatorio debo modificar.",
          "MISSING_TARGET_EVENT"
        );
      }

const result = await updateEvent({
  companyId,
  customerId,
  eventId: resolvedEventId,
  type: normalizeEventType(request.type),
  contentKey: asText(request.contentKey) || undefined,
  title: asText(request.title) || undefined,
  prompt: asText(request.prompt) || undefined,
  localTime: request.localTime,
  runAt: request.runAt,
  nextRunAt: request.nextRunAt,
  daysOfWeek: request.daysOfWeek,
  timezone: asText(request.timezone) || undefined,
  status: request.status,
  conversationId,
  meta:
    typeof request.isOneTime === "boolean"
      ? { isOneTime: request.isOneTime }
      : undefined
});

      return {
        kind: "DONE" as const,
        action: "update",
        data: result
      };
    }

    if (request.action === "create" || request.action === "auto") {
      const normalizedType = normalizeEventType(request.type);

      if (!normalizedType) {
        throw new Error("Missing type");
      }

      const result = await createEvent({
        companyId,
        agentId,
        customerId,
        type: normalizedType,
        product: asText(request.product) || null,
        contentKey: asText(request.contentKey),
        title: asText(request.title),
        prompt: asText(request.prompt),
        localTime: request.localTime || null,
        daysOfWeek: getDaysValue(request.daysOfWeek),
        runAt: request.runAt || null,
        nextRunAt: request.nextRunAt || null,
        timezone: getTimezoneValue(request.timezone),
        status: getStatusValue(request.status),
        conversationId,
        meta: {
          isOneTime: request.isOneTime === true
        }
      });

      return {
        kind: "DONE" as const,
        action: request.action,
        data: result
      };
    }

    throw new Error("Unsupported event request action");
  } catch (error) {
    return buildExecutionError(mapExecutionErrorToUserMessage(error), error);
  }
}