// lib/crussader-assistant/intake/helpers/normalizeAssistantIntent.ts
import { normalizeEventSchedule } from "../../domains/events/helpers/normalizeEventSchedule";

type NormalizedAssistantIntent = {
  requestedInstruction: string | null;
  action: string | null;
  product: string | null;
  subtype: string | null;
  status: "WAITING_FOR_DATA" | "READY";
  collectedData: Record<string, unknown>;
  missingFields: string[];
};

function asText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getMissingFields(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeCreateEventCollectedData(
  collectedData: Record<string, unknown>
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    ...collectedData
  };

  const eventName = asText(collectedData.eventName);
  const title = asText(collectedData.title);
  const prompt = asText(collectedData.prompt);
  const timezone = asText(collectedData.timezone);
  const contentKey = asText(collectedData.contentKey);
  const type = asText(collectedData.type);

  if (!title && eventName) {
    normalized.title = eventName;
  }

  if (!prompt && eventName) {
    normalized.prompt = eventName;
  }

  if (!type) {
    normalized.type = "REMINDER";
  }

  if (!contentKey) {
    normalized.contentKey = "reminder";
  }

  if (!timezone) {
    normalized.timezone = "Europe/Madrid";
  }

  const schedule = normalizeEventSchedule({
    date: collectedData.date,
    time: collectedData.time,
    timezone: normalized.timezone
  });

  normalized.localTime = schedule.localTime;
  normalized.runAt = schedule.runAt;
  normalized.nextRunAt = schedule.nextRunAt;
  normalized.isOneTime = schedule.isOneTime;
  normalized.daysOfWeek = schedule.daysOfWeek;
  normalized.timezone = schedule.timezone;

  return normalized;
}

function normalizeUpdateEventCollectedData(
  collectedData: Record<string, unknown>
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    ...collectedData
  };

  const eventName = asText(collectedData.eventName);
  const title = asText(collectedData.title);
  const prompt = asText(collectedData.prompt);
  const timezone = asText(collectedData.timezone);

  if (!title && eventName) {
    normalized.title = eventName;
  }

  if (!prompt && eventName) {
    normalized.prompt = eventName;
  }

  if (!timezone) {
    normalized.timezone = "Europe/Madrid";
  }

  const rawTime = asText(collectedData.time);
  const rawDate = asText(collectedData.date);

  if (rawTime) {
    const schedule = normalizeEventSchedule({
      date: rawDate,
      time: rawTime,
      timezone: normalized.timezone
    });

    normalized.localTime = schedule.localTime;

    if (rawDate) {
      normalized.runAt = schedule.runAt;
      normalized.nextRunAt = schedule.nextRunAt;
      normalized.isOneTime = schedule.isOneTime;
      normalized.daysOfWeek = schedule.daysOfWeek;
    }
  }

  return normalized;
}

export function normalizeAssistantIntent(input: {
  requestedInstruction: string | null;
  action: string | null;
  product: string | null;
  subtype: string | null;
  collectedData?: Record<string, unknown> | null;
  missingFields?: string[] | null;
}): NormalizedAssistantIntent {
  const requestedInstruction = input.requestedInstruction;
  const action = input.action;
  const product = input.product;
  const subtype = input.subtype;

  let collectedData: Record<string, unknown> = {};
  if (input.collectedData) {
    collectedData = input.collectedData;
  }

  const missingFields = getMissingFields(input.missingFields);

if (requestedInstruction === "CREATE_EVENT") {
  collectedData = normalizeCreateEventCollectedData(collectedData);
}

if (requestedInstruction === "UPDATE_EVENT") {
  collectedData = normalizeUpdateEventCollectedData(collectedData);
}

  let status: "WAITING_FOR_DATA" | "READY" = "READY";

  if (missingFields.length > 0) {
    status = "WAITING_FOR_DATA";
  }

  return {
    requestedInstruction,
    action,
    product,
    subtype,
    status,
    collectedData,
    missingFields
  };
}
