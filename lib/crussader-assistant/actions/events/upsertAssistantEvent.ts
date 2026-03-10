// lib/crussader-assistant/actions/events/upsertAssistantEvent.ts
import { prisma } from "@/lib/prisma";
import { parseNaturalTime } from "@/lib/crussader-assistant/utils/parseNaturalTime";

type AssistantEventType = "GOSPEL" | "NEWS" | "REMINDER" | "CUSTOM";

function asText(value: unknown) {
  return String(value || "").trim();
}



function getNowInTimezone(timezone: string) {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;

  for (const p of parts) {
    if (p.type === "year") year = Number(p.value);
    if (p.type === "month") month = Number(p.value);
    if (p.type === "day") day = Number(p.value);
    if (p.type === "hour") hour = Number(p.value);
    if (p.type === "minute") minute = Number(p.value);
    if (p.type === "second") second = Number(p.value);
  }

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return date;
}
type UpsertAssistantEventArgs = {
  companyId: string;
  agentId: string;
  customerId: string;
  type: AssistantEventType;
  title: string;
  prompt: string;
  localTime?: string | null;
  daysOfWeek?: number[];
  timeExpression?: string | null;
  isOneTime?: boolean;
  timezone?: string | null;
  status?: "ACTIVE" | "PAUSED" | "CANCELLED";
  conversationId?: string;
};





function normalizeDays(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const out: number[] = [];

  for (const item of value) {
    const num = Number(item);

    if (!Number.isInteger(num)) {
      continue;
    }

    if (num < 0 || num > 6) {
      continue;
    }

    if (out.includes(num)) {
      continue;
    }

    out.push(num);
  }

  return out.sort((a, b) => a - b);
}

function parseLocalTime(value: string) {
  const text = asText(value);

  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error("Invalid localTime. Expected HH:mm");
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23) {
    throw new Error("Invalid localTime hour");
  }

  if (minute < 0 || minute > 59) {
    throw new Error("Invalid localTime minute");
  }

  const date = new Date("1970-01-01T00:00:00.000Z");
  date.setUTCHours(hour);
  date.setUTCMinutes(minute);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  return date;
}

function calculateNextRun(args: {
  localTime: string;
  daysOfWeek: number[];
}) {
  const now = getNowInTimezone("Europe/Madrid");

  const parts = args.localTime.split(":");
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  const next = new Date(now);
  next.setSeconds(0);
  next.setMilliseconds(0);

  for (let i = 0; i < 8; i += 1) {
    if (i > 0) {
      next.setDate(next.getDate() + 1);
    }

    const day = next.getDay();

    if (!args.daysOfWeek.includes(day)) {
      continue;
    }

    next.setHours(hour);
    next.setMinutes(minute);

    if (i === 0 && next.getTime() <= now.getTime()) {
      continue;
    }

    return next;
  }

  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(hour);
  fallback.setMinutes(minute);
  fallback.setSeconds(0);
  fallback.setMilliseconds(0);

  return fallback;
}

function parseRelativeTime(text: string): Date | null {
  const clean = asText(text).toLowerCase();

  if (!clean) {
    return null;
  }

  const normalized = clean
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

export async function upsertAssistantEvent(args: UpsertAssistantEventArgs) {
  const companyId = asText(args.companyId);
  const agentId = asText(args.agentId);
  const customerId = asText(args.customerId);
  const type = args.type;
  const title = asText(args.title);
  const prompt = asText(args.prompt);
const timezone = asText(args.timezone || "Europe/Madrid");
const status = args.status || "ACTIVE";
const timeExpression = asText(args.timeExpression);

console.log("[upsertAssistantEvent] incoming args", {
  isOneTimeRaw: args.isOneTime,
  localTimeRaw: args.localTime,
  timeExpressionRaw: args.timeExpression,
  localTimeParsed: asText(args.localTime),
  timeExpressionParsed: timeExpression,
});

let isOneTime = false;

if (args.isOneTime === true) {
  isOneTime = true;
} else {
  if (timeExpression) {
    const parsedRelativeCandidate = parseRelativeTime(timeExpression);

    if (parsedRelativeCandidate) {
      isOneTime = true;
    }
  }
}

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!agentId) {
    throw new Error("Missing agentId");
  }

  if (!customerId) {
    throw new Error("Missing customerId");
  }

  if (!type) {
    throw new Error("Missing type");
  }

  if (!title) {
    throw new Error("Missing title");
  }

  if (!prompt) {
    throw new Error("Missing prompt");
  }

  let usesTools = false;
  const promptLower = prompt.toLowerCase();

  if (promptLower.includes("usa la herramienta")) {
    usesTools = true;
  }

  let normalizedTimeExpression = timeExpression;
let normalizedLocalTimeText = asText(args.localTime);

if (!normalizedTimeExpression && normalizedLocalTimeText) {
  const parsedRelativeFromLocalTime = parseRelativeTime(normalizedLocalTimeText);

  if (parsedRelativeFromLocalTime) {
    normalizedTimeExpression = normalizedLocalTimeText;
    isOneTime = true;
    normalizedLocalTimeText = "";
  }
}

if (!isOneTime && normalizedTimeExpression) {
  const parsedRelativeFromExpression = parseRelativeTime(normalizedTimeExpression);

  if (parsedRelativeFromExpression) {
    isOneTime = true;
  }
}

  let runAt: Date | null = null;
  let localTime: Date | null = null;
  let daysOfWeek: number[] = [];
  let nextRunAt: Date | null = null;

  if (isOneTime) {
if (!normalizedTimeExpression) {
  throw new Error("Missing timeExpression for one-time event");
}

const parsedRelative = parseRelativeTime(normalizedTimeExpression);

    if (!parsedRelative) {
      throw new Error("Invalid timeExpression");
    }

    runAt = parsedRelative;
    nextRunAt = parsedRelative;
  } else {
let localTimeText = normalizedLocalTimeText;

    if (!localTimeText) {
      throw new Error("Missing localTime");
    }

    const parsedTime = parseNaturalTime(localTimeText);

    if (parsedTime) {
      localTimeText = parsedTime;
    }

    localTime = parseLocalTime(localTimeText);
    daysOfWeek = normalizeDays(args.daysOfWeek);

    if (daysOfWeek.length === 0) {
      throw new Error("Missing daysOfWeek");
    }

    nextRunAt = calculateNextRun({
      localTime: localTimeText,
      daysOfWeek,
    });
  }

  const created = await prisma.agent_event.create({
    data: {
      company_id: companyId,
      agent_id: agentId,
      customer_id: customerId,
      type,
      title,
      prompt,
      timezone,
      local_time: localTime,
      days_of_week: isOneTime ? [runAt ? runAt.getDay() : new Date().getDay()] : daysOfWeek,
      run_at: runAt,
      status,
      is_active: status === "ACTIVE",
      conversation_id: args.conversationId || null,
      next_run_at: nextRunAt,
      meta: {
        usesTools,
        isOneTime,
        timeExpression: timeExpression || null,
      },
    },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      local_time: true,
      days_of_week: true,
      run_at: true,
      next_run_at: true,
    },
  });

  return {
    kind: "CREATED" as const,
    event: created,
  };
}