// lib/crussader-assistant/reply/generateReplyFromDecision.ts

import { universalResponseStyler } from "./universalResponseStyler";
import { buildReplyPromptFromDecision } from "./buildReplyPromptFromDecision";

export type ReplyDecision =
  | {
      type: "ASK_FOR_MISSING_FIELDS";
      requestedInstruction?: string | null;
      action?: string | null;
      product?: string | null;
      subtype?: string | null;
      collectedData: Record<string, unknown>;
      missingFields: string[];
      lastAssistantQuestion?: string | null;
    }
  | {
      type: "CONFIRM_ACTION";
      requestedInstruction?: string | null;
      action?: string | null;
      product?: string | null;
      subtype?: string | null;
      collectedData: Record<string, unknown>;
      executionMessage?: string | null;
      lastAssistantQuestion?: string | null;
      executionPayload?: Record<string, unknown>;
    }
  | {
      type: "EXECUTION_ERROR";
      requestedInstruction?: string | null;
      action?: string | null;
      product?: string | null;
      subtype?: string | null;
      collectedData: Record<string, unknown>;
      executionMessage?: string | null;
      lastAssistantQuestion?: string | null;
      executionPayload?: Record<string, unknown>;
    }
  | {
      type: "FALLBACK";
      reason?: string;
      lastAssistantQuestion?: string | null;
    };

    function formatTimeValue(value: unknown): string {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid"
  }).format(date);
}

function formatDateTimeValue(value: unknown): string {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid"
  }).format(date);
}

function buildDeterministicListEventsReply(
  executionPayload: Record<string, unknown>
): string | null {
  const eventResult =
    executionPayload.eventResult &&
    typeof executionPayload.eventResult === "object"
      ? executionPayload.eventResult as Record<string, unknown>
      : null;

  const data =
    eventResult &&
    eventResult.data &&
    typeof eventResult.data === "object"
      ? eventResult.data as Record<string, unknown>
      : null;

  const events = data && Array.isArray(data.events) ? data.events : [];

  if (!events.length) {
    return "No tienes recordatorios activos.";
  }

  const lines: string[] = [];

  for (let index = 0; index < events.length; index += 1) {
    const rawEvent = events[index];

    if (!rawEvent || typeof rawEvent !== "object") {
      continue;
    }

    const event = rawEvent as Record<string, unknown>;
    const title =
      typeof event.title === "string" && event.title.trim()
        ? event.title.trim()
        : "Recordatorio sin título";

    const runAtText = formatDateTimeValue(event.run_at);
    const localTimeText = formatTimeValue(event.local_time);

    let detail = "";

    if (runAtText) {
      detail = `, programado para ${runAtText}`;
    } else if (localTimeText) {
      detail = `, a las ${localTimeText}`;
    }

    lines.push(`${index + 1}. ${title}${detail}`);
  }

  if (!lines.length) {
    return "Tienes recordatorios activos, pero no he podido leer sus detalles.";
  }

  const header =
    events.length === 1
      ? "Tienes 1 recordatorio activo:"
      : `Tienes ${events.length} recordatorios activos:`;

  return `${header}\n${lines.join("\n")}`;
}

export async function generateReplyFromDecision(
  decision: ReplyDecision
): Promise<string> {
    if (
    decision.type === "CONFIRM_ACTION" &&
    decision.requestedInstruction === "LIST_EVENTS"
  ) {
    const executionPayload =
      decision.executionPayload &&
      typeof decision.executionPayload === "object"
        ? decision.executionPayload
        : {};

    const deterministicReply = buildDeterministicListEventsReply(
      executionPayload
    );

    if (deterministicReply) {
      return deterministicReply;
    }
  }

  const prompt = buildReplyPromptFromDecision(decision);

  const styled = await universalResponseStyler({
    message: prompt,
    style: "friendly",
    length: "short",
    enthusiasm: "medium",
    emojis: "none",
    language: "es",
    channel: "whatsapp",
    context: {
      decisionType: decision.type,
      requestedInstruction:
        "requestedInstruction" in decision
          ? decision.requestedInstruction || null
          : null,
      missingFields:
        "missingFields" in decision ? decision.missingFields : [],
      collectedData:
        "collectedData" in decision ? decision.collectedData : {}
    }
  });

  return styled.text || "No he podido generar la respuesta.";
}