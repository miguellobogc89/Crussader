// lib/crussader-assistant/pipeline/helpers/assistantPipelineHelpers.ts
import type { agent_event_type } from "@prisma/client";
import type { handleEventRequest } from "../../actions/events";

type EventRequestAction =
  | "create"
  | "update"
  | "pause"
  | "resume"
  | "list"
  | "list_paused"
  | "auto";

export type EventOrchestratorRequest = {
  action: EventRequestAction;
  type?: agent_event_type;
  eventId?: string;
  product?: string;
  contentKey?: string;
  title?: string;
  prompt?: string;
  localTime?: Date | null;
  runAt?: Date | null;
  nextRunAt?: Date | null;
  isOneTime?: boolean;
  eventName?: string;
  daysOfWeek?: number[];
  timezone?: string | null;
  status?: "ACTIVE" | "PAUSED" | "CANCELLED";
};

type HandleEventRequestResult = Awaited<ReturnType<typeof handleEventRequest>>;

export function asText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function normalizeAgentEventType(
  value: unknown
): agent_event_type | undefined {
  const type = asText(value).toUpperCase();

  if (type === "REMINDER") {
    return "REMINDER";
  }

  if (type === "DELIVERY") {
    return "DELIVERY";
  }

  if (type === "ALERT") {
    return "ALERT";
  }

  if (type === "CAMPAIGN") {
    return "CAMPAIGN";
  }

  return undefined;
}

export function getEventResultMessage(
  result: HandleEventRequestResult
): string {
  if ("messageForUser" in result) {
    const message = asText(result.messageForUser);

    if (message) {
      return message;
    }
  }

  if (result.kind === "DONE") {
    return "Hecho.";
  }

  return "Falta información para completarlo.";
}

function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value;
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) {
      return null;
    }

    const parsed = new Date(text);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  return null;
}

function parseRelativeTimeToDate(value: unknown): Date | null {
  const text = asText(value).toLowerCase();

  if (!text) {
    return null;
  }

  const normalized = text
    .replace(/\bdos\b/g, "2")
    .replace(/\btres\b/g, "3")
    .replace(/\bcuatro\b/g, "4")
    .replace(/\bcinco\b/g, "5")
    .replace(/\bseis\b/g, "6")
    .replace(/\bsiete\b/g, "7")
    .replace(/\bocho\b/g, "8")
    .replace(/\bnueve\b/g, "9")
    .replace(/\bdiez\b/g, "10")
    .replace(/\bonce\b/g, "11")
    .replace(/\bdoce\b/g, "12")
    .replace(/\bquince\b/g, "15")
    .replace(/\btreinta\b/g, "30")
    .replace(/\buna\b/g, "1")
    .replace(/\bun\b/g, "1");

  const now = new Date();

  if (
    normalized.includes("media hora") ||
    normalized.includes("1/2 hora") ||
    normalized.includes("30 minuto")
  ) {
    return new Date(now.getTime() + 30 * 60 * 1000);
  }

  const minuteMatch = normalized.match(/(\d+)\s*minuto/);

  if (minuteMatch) {
    const minutes = Number(minuteMatch[1]);

    if (minutes > 0) {
      return new Date(now.getTime() + minutes * 60 * 1000);
    }
  }

  const hourMatch = normalized.match(/(\d+)\s*hora/);

  if (hourMatch) {
    const hours = Number(hourMatch[1]);

    if (hours > 0) {
      return new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
  }

  return null;
}

export function isConversationalIntent(args: {
  requestedInstruction: string | null;
  action: string | null;
  product: string | null;
}) {
  const instruction = args.requestedInstruction;
  const action = args.action;
  const product = args.product;

  if (!instruction && !action && !product) {
    return true;
  }

  if (instruction === "GREETING") {
    return true;
  }

  if (instruction === "CHAT") {
    return true;
  }

  if (instruction === "QUERY" && product === "INFORMATION") {
    return true;
  }

  if (instruction === "INFORMATION") {
    return true;
  }

  return false;
}

export function buildLogTitle(args: {
  requestedInstruction: string | null;
  product: string | null;
  subtype: string | null;
}): string {
  if (args.requestedInstruction === "CREATE_EVENT") {
    return "Creación de recordatorio";
  }

  if (
    args.requestedInstruction === "SUBSCRIBE" &&
    args.subtype === "PRAYER"
  ) {
    return "Suscripción de oración";
  }

  if (args.requestedInstruction === "SUBSCRIBE") {
    return "Suscripción";
  }

  if (args.product === "EVENT") {
    return "Acción sobre evento";
  }

  return "Acción del asistente";
}

export function buildLogDescription(args: {
  requestedInstruction: string | null;
  product: string | null;
  subtype: string | null;
  collectedData: Record<string, unknown>;
  resultOk: boolean;
}): string {
  const eventName = asText(args.collectedData.eventName);
  const scheduledDate = asText(args.collectedData.scheduledDate);
  const localTime = asText(args.collectedData.localTime);
  const content = asText(args.collectedData.content);
  const frequency = asText(args.collectedData.frequency);

  let suffix = "con error";

  if (args.resultOk) {
    suffix = "creado correctamente";
  }

  if (
    args.requestedInstruction === "CREATE_EVENT" ||
    args.product === "EVENT"
  ) {
    const parts: string[] = [];

    if (eventName) {
      parts.push(eventName);
    }

    if (scheduledDate) {
      parts.push(scheduledDate);
    }

    if (localTime) {
      parts.push(localTime);
    }

    if (parts.length > 0) {
      return `Creación de recordatorio para ${parts.join(" ")} ${suffix}`;
    }

    return `Creación de recordatorio ${suffix}`;
  }

  if (
    args.requestedInstruction === "SUBSCRIBE" &&
    args.subtype === "PRAYER"
  ) {
    const parts: string[] = [];

    if (content) {
      parts.push(content);
    }

    if (frequency) {
      parts.push(frequency);
    }

    if (localTime) {
      parts.push(localTime);
    }

    if (parts.length > 0) {
      return `Suscripción de oración para ${parts.join(" ")} ${suffix}`;
    }

    return `Suscripción de oración ${suffix}`;
  }

  return `Acción del asistente ${suffix}`;
}

export function buildEventOrchestratorRequest(args: {
  requestedInstruction: string | null;
  action: string | null;
  product: string | null;
  subtype: string | null;
  collectedData: Record<string, unknown>;
}): EventOrchestratorRequest | null {
  const requestedInstruction = asText(args.requestedInstruction).toUpperCase();
  const action = asText(args.action).toUpperCase();
  const product = asText(args.product).toUpperCase();
  const collectedData = args.collectedData || {};

  let requestAction: EventRequestAction | null = null;

  if (action === "CREATE") {
    requestAction = "auto";
  } else if (action === "UPDATE") {
    requestAction = "update";
  } else if (action === "CANCEL") {
    requestAction = "pause";
  } else if (action === "RESUME") {
    requestAction = "resume";
  } else if (action === "LIST") {
    requestAction = "list";
  }

  const isEventDomain =
    product === "EVENT" ||
    product === "SUBSCRIPTION" ||
    product === "ALERT" ||
    requestedInstruction === "CREATE_EVENT" ||
    requestedInstruction === "CREATE_SUBSCRIPTION" ||
    requestedInstruction === "SUBSCRIBE";

  if (!isEventDomain) {
    return null;
  }

  if (!requestAction) {
    return null;
  }

  const localTime = toDateOrNull(collectedData.localTime);
  let runAt = toDateOrNull(collectedData.runAt);
  let nextRunAt = toDateOrNull(collectedData.nextRunAt);

  if (!runAt) {
    runAt = parseRelativeTimeToDate(collectedData.time);
  }

  if (runAt && !nextRunAt) {
    nextRunAt = runAt;
  }

  let isOneTime: boolean | undefined = undefined;

  if (typeof collectedData.isOneTime === "boolean") {
    isOneTime = collectedData.isOneTime;
  }

  if (!isOneTime && runAt) {
    isOneTime = true;
  }

  let daysOfWeek: number[] | undefined = undefined;

  if (Array.isArray(collectedData.daysOfWeek) && collectedData.daysOfWeek.length > 0) {
    daysOfWeek = collectedData.daysOfWeek;
  }

  const rawStatus = asText(collectedData.status);
  let status: "ACTIVE" | "PAUSED" | "CANCELLED" | undefined = undefined;

  if (rawStatus === "ACTIVE") {
    status = "ACTIVE";
  }

  if (rawStatus === "PAUSED") {
    status = "PAUSED";
  }

  if (rawStatus === "CANCELLED") {
    status = "CANCELLED";
  }

  const timezone = asText(collectedData.timezone) || "Europe/Madrid";

  return {
    action: requestAction,
    type: normalizeAgentEventType(collectedData.type),
    eventId: asText(collectedData.eventId) || undefined,
    contentKey: asText(collectedData.contentKey) || undefined,
    title: asText(collectedData.title) || undefined,
    prompt: asText(collectedData.prompt) || undefined,
    eventName: asText(collectedData.eventName) || undefined,
    product: asText(collectedData.product) || "EVENT",
    localTime,
    runAt,
    nextRunAt,
    isOneTime,
    daysOfWeek,
    timezone,
    status
  };
}