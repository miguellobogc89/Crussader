// lib/crussader-assistant/intake/helpers/normalizeIntakeData.ts

import type { IntakeCapabilityKey } from "../intakeCatalog";
import type { IntakeMemoryState } from "../intakeTypes";

function asText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getTomorrowDateString(timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const now = new Date();
  const parts = formatter.formatToParts(now);

  let year = 0;
  let month = 0;
  let day = 0;

  for (const part of parts) {
    if (part.type === "year") {
      year = Number(part.value);
    }

    if (part.type === "month") {
      month = Number(part.value);
    }

    if (part.type === "day") {
      day = Number(part.value);
    }
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 1);

  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export function normalizeCollectedDataForPendingIntent(
  capability: IntakeCapabilityKey | null,
  collectedData: Record<string, unknown>
) {
  const normalized: Record<string, unknown> = {
    ...collectedData
  };

  const timezone = asText(collectedData.timezone) || "Europe/Madrid";

  if (capability === "CREATE_EVENT" || capability === "SUBSCRIBE_CONTENT") {
let rawDate = asText(collectedData.date).toLowerCase();
let rawTime = asText(collectedData.time);

const relativeTimeText = rawTime.trim().toLowerCase();

const looksLikeRelativeTime =
  relativeTimeText === "en un minuto" ||
  relativeTimeText === "en 1 minuto" ||
  relativeTimeText === "en media hora" ||
  relativeTimeText === "media hora" ||
  relativeTimeText === "en un cuarto de hora" ||
  relativeTimeText === "en cuarto de hora" ||
  relativeTimeText === "en 15 minutos" ||
  relativeTimeText === "en una hora" ||
  relativeTimeText === "en 1 hora" ||
  /^en \d{1,3} minutos?$/.test(relativeTimeText) ||
  /^en \d{1,3} horas?$/.test(relativeTimeText);

if (!rawDate && looksLikeRelativeTime) {
  rawDate = relativeTimeText;
  rawTime = "";
}

    let scheduleMode = "UNSPECIFIED";
    let scheduledDate = "";
    let daysOfWeek: number[] = [];

    if (rawDate === "maÃ±ana") {
      scheduleMode = "ONE_TIME";
      scheduledDate = getTomorrowDateString(timezone);
    }

    if (!rawDate && rawTime) {
      scheduleMode = "RECURRING";
      daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
    }

    if (rawDate) {
      normalized.rawDate = rawDate;
      normalized.date = rawDate;
    }

    if (rawTime) {
      normalized.localTime = rawTime;
    }

    normalized.timezone = timezone;
    normalized.scheduleMode = scheduleMode;
    normalized.scheduledDate = scheduledDate;
    normalized.daysOfWeek = daysOfWeek;
  }

  return normalized;
}

export function mapPendingTaskToPendingIntent(
  pendingTask: IntakeMemoryState["pendingTask"]
) {
  if (!pendingTask) {
    return null;
  }

  if (pendingTask.status === "NONE") {
    return null;
  }

  let requestedInstruction: string | null = null;
  let action: string | null = null;
  let product: string | null = null;
  const subtype: string | null = null;

  if (pendingTask.capability === "CREATE_EVENT") {
    requestedInstruction = "CREATE_EVENT";
    action = "CREATE";
    product = "EVENT";
  }

  if (pendingTask.capability === "SUBSCRIBE_CONTENT") {
    requestedInstruction = "CREATE_SUBSCRIPTION";
    action = "CREATE";
    product = "SUBSCRIPTION";
  }

  if (pendingTask.capability === "QUERY_INFORMATION") {
    requestedInstruction = "QUERY_INFORMATION";
    action = "QUERY";
    product = "INFORMATION";
  }
    if (pendingTask.capability === "LIST_EVENTS") {
    requestedInstruction = "LIST_EVENTS";
    action = "LIST";
    product = "EVENT";
  }

  if (pendingTask.capability === "UPDATE_EVENT") {
    requestedInstruction = "UPDATE_EVENT";
    action = "UPDATE";
    product = "EVENT";
  }

  if (pendingTask.capability === "PAUSE_EVENT") {
    requestedInstruction = "PAUSE_EVENT";
    action = "CANCEL";
    product = "EVENT";
  }

  if (pendingTask.capability === "RESUME_EVENT") {
    requestedInstruction = "RESUME_EVENT";
    action = "RESUME";
    product = "EVENT";
  }

  if (pendingTask.capability === "CANCEL_EVENT") {
    requestedInstruction = "CANCEL_EVENT";
    action = "CANCEL";
    product = "EVENT";
  }

  if (pendingTask.capability === "CANCEL_ALL_EVENTS") {
    requestedInstruction = "CANCEL_ALL_EVENTS";
    action = "CANCEL";
    product = "EVENT";
  }

  if (!requestedInstruction) {
    return null;
  }

  if (!action) {
    return null;
  }

  if (!product) {
    return null;
  }

  let status: "READY" | "WAITING_FOR_DATA" = "WAITING_FOR_DATA";

  if (pendingTask.status === "READY") {
    status = "READY";
  }

  const normalizedCollectedData = normalizeCollectedDataForPendingIntent(
    pendingTask.capability,
    pendingTask.collectedData
  );

  const missingFields = Array.isArray(pendingTask.missingFields)
    ? pendingTask.missingFields.filter((item: unknown) => typeof item === "string")
    : [];

  return {
    requestedInstruction,
    action,
    product,
    subtype,
    status,
    collectedData: normalizedCollectedData,
    missingFields
  };
}
