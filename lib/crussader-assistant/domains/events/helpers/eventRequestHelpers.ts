// lib/crussader-assistant/domains/events/helpers/eventRequestHelpers.ts

function asText(value: unknown) {
  return String(value || "").trim();
}

function getMetaRecord(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return {};
  }

  return meta as Record<string, unknown>;
}

export function getMetaContentKey(meta: unknown) {
  const record = getMetaRecord(meta);
  return asText(record.contentKey);
}

export function getMetaIsOneTime(meta: unknown) {
  const record = getMetaRecord(meta);

  if (record.isOneTime === true) {
    return true;
  }

  return false;
}

export function sameDays(a: unknown, b: unknown) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (Number(a[i]) !== Number(b[i])) {
      return false;
    }
  }

  return true;
}

export function sameDateTime(a: unknown, b: unknown) {
  if (!(a instanceof Date) || !(b instanceof Date)) {
    return false;
  }

  if (a.getTime() !== b.getTime()) {
    return false;
  }

  return true;
}

export function sameLocalTime(a: unknown, b: unknown) {
  if (!(a instanceof Date) || !(b instanceof Date)) {
    return false;
  }

  if (a.getUTCHours() !== b.getUTCHours()) {
    return false;
  }

  if (a.getUTCMinutes() !== b.getUTCMinutes()) {
    return false;
  }

  return true;
}

export function isSameSchedule(args: {
  requestLocalTime?: Date | null;
  requestRunAt?: Date | null;
  requestDaysOfWeek?: number[];
  requestIsOneTime?: boolean;
  eventLocalTime?: unknown;
  eventRunAt?: unknown;
  eventDaysOfWeek?: unknown;
  eventMeta?: unknown;
}) {
  const requestedIsOneTime = args.requestIsOneTime === true;
  const existingIsOneTime = getMetaIsOneTime(args.eventMeta);

  if (requestedIsOneTime !== existingIsOneTime) {
    return false;
  }

  if (requestedIsOneTime) {
    if (!(args.requestRunAt instanceof Date)) {
      return false;
    }

    return sameDateTime(args.requestRunAt, args.eventRunAt);
  }

  if (!(args.requestLocalTime instanceof Date)) {
    return false;
  }

  if (!sameLocalTime(args.requestLocalTime, args.eventLocalTime)) {
    return false;
  }

  if (!sameDays(args.requestDaysOfWeek, args.eventDaysOfWeek)) {
    return false;
  }

  return true;
}

export function buildNeedsInfo(message: string, missing: string[]) {
  return {
    kind: "NEEDS_INFO" as const,
    messageForUser: message,
    missing
  };
}

export function buildExecutionError(messageForUser: string, error: unknown) {
  let detail = "Unknown error";

  if (error instanceof Error) {
    detail = error.message;
  }

  return {
    kind: "EXECUTION_ERROR" as const,
    messageForUser,
    errorDetail: detail
  };
}

export function mapExecutionErrorToUserMessage(error: unknown) {
  let message = "";

  if (error instanceof Error) {
    message = error.message.toLowerCase();
  }

  if (message.includes("date")) return "No entiendo esa fecha.";
  if (message.includes("time")) return "No entiendo esa hora.";
  if (message.includes("event not found")) return "No encuentro esa tarea.";

  return "No he podido completar esa tarea.";
}

export function getTimezoneValue(value: unknown) {
  const text = asText(value);

  if (!text) {
    return "Europe/Madrid";
  }

  return text;
}

export function getStatusValue(value: unknown) {
  if (value === "PAUSED") return "PAUSED";
  if (value === "CANCELLED") return "CANCELLED";

  return "ACTIVE";
}

export function getDaysValue(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value;
}