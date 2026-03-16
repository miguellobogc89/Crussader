// lib/crussader-assistant/domains/events/helpers/normalizeEventSchedule.ts
type NormalizeEventScheduleInput = {
  date?: unknown;
  time?: unknown;
  timezone?: unknown;
};

type NormalizeEventScheduleResult = {
  localTime: Date | null;
  runAt: Date | null;
  nextRunAt: Date | null;
  isOneTime: boolean;
  daysOfWeek: number[];
  timezone: string;
};

function asText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function buildRelativeRunAt(minutesToAdd: number): Date | null {
  if (minutesToAdd <= 0) {
    return null;
  }

  const runAt = new Date();
  runAt.setSeconds(0, 0);
  runAt.setMinutes(runAt.getMinutes() + minutesToAdd);
  return runAt;
}

function getRelativeMinutes(rawDate: string): number | null {
  const text = rawDate.trim().toLowerCase();

  if (!text) {
    return null;
  }

  if (
    text === "en un minuto" ||
    text === "en 1 minuto"
  ) {
    return 1;
  }

  if (
    text === "en media hora" ||
    text === "media hora"
  ) {
    return 30;
  }

  if (
    text === "en un cuarto de hora" ||
    text === "en cuarto de hora" ||
    text === "en 15 minutos"
  ) {
    return 15;
  }

  if (
    text === "en una hora" ||
    text === "en 1 hora"
  ) {
    return 60;
  }

  const minuteMatch = text.match(/^en (\d{1,3}) minutos?$/);
  if (minuteMatch) {
    return Number(minuteMatch[1]);
  }

  const hourMatch = text.match(/^en (\d{1,3}) horas?$/);
  if (hourMatch) {
    return Number(hourMatch[1]) * 60;
  }

  return null;
}

function buildTimeDate(rawTime: string): Date | null {
  const match = rawTime.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  if (hours < 0 || hours > 23) {
    return null;
  }

  if (minutes < 0 || minutes > 59) {
    return null;
  }

  const localTime = new Date(0);
  localTime.setUTCHours(hours, minutes, 0, 0);
  return localTime;
}

function buildTomorrowRunAt(rawTime: string): Date | null {
  const match = rawTime.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const now = new Date();
  const runAt = new Date(now);
  runAt.setDate(runAt.getDate() + 1);
  runAt.setHours(hours, minutes, 0, 0);
  return runAt;
}

function buildTodayRunAt(rawTime: string): Date | null {
  const match = rawTime.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const now = new Date();
  const runAt = new Date(now);
  runAt.setHours(hours, minutes, 0, 0);

  return runAt;
}

export function normalizeEventSchedule(
  input: NormalizeEventScheduleInput
): NormalizeEventScheduleResult {
  const rawDate = asText(input.date).toLowerCase();
  const rawTime = asText(input.time);
  const relativeMinutes = getRelativeMinutes(rawDate);
  const rawTimezone = asText(input.timezone);

  let timezone = "Europe/Madrid";
  if (rawTimezone) {
    timezone = rawTimezone;
  }

  let localTime: Date | null = null;
  let runAt: Date | null = null;
  let nextRunAt: Date | null = null;
  let isOneTime = true;
  let daysOfWeek: number[] = [];

  if (rawTime) {
    localTime = buildTimeDate(rawTime);
  }

  if (relativeMinutes !== null) {
    runAt = buildRelativeRunAt(relativeMinutes);
    nextRunAt = runAt;
    isOneTime = true;
  }

  if (rawDate === "hoy" && rawTime) {
    runAt = buildTodayRunAt(rawTime);
    nextRunAt = runAt;
  }

  if (rawDate === "mañana" && rawTime) {
    runAt = buildTomorrowRunAt(rawTime);
    nextRunAt = runAt;
  }

  return {
    localTime,
    runAt,
    nextRunAt,
    isOneTime,
    daysOfWeek,
    timezone
  };
}