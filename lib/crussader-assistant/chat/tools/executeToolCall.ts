// lib/crussader-assistant/chat/tools/executeToolCall.ts

import type { ChatCompletion } from "openai/resources/chat/completions";

import { getNews } from "./news/getNews";
import { upsertAssistantEvent } from "@/lib/crussader-assistant/actions/events/upsertAssistantEvent";
import { listAssistantEvents } from "@/lib/crussader-assistant/actions/events/listAssistantEvents";
import { pauseEvent } from "@/lib/crussader-assistant/actions/events/pauseEvent";
import { resumeEvent } from "@/lib/crussader-assistant/actions/events/resumeEvent";
import { getPrayer } from "./prayer/getPrayer";
import {
  getAssistantSessionMemory,
  updateAssistantSessionMemory,
} from "@/lib/crussader-assistant/memory/sessionMemory";

type ExecuteToolCallArgs = {
  choice: ChatCompletion.Choice;
  args: {
    sessionId: string;
    companyId: string;
    agentId: string;
    customerId: string;
  };
};

function asText(value: unknown) {
  return String(value || "").trim();
}

function parseArgs(raw: string) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

function toAssistantEventType(
  value: unknown
): "GOSPEL" | "NEWS" | "REMINDER" | "CUSTOM" {
  const text = asText(value);

  if (text === "GOSPEL") {
    return text;
  }

  if (text === "NEWS") {
    return text;
  }

  if (text === "REMINDER") {
    return text;
  }

  if (text === "CUSTOM") {
    return text;
  }

  throw new Error("Invalid assistant event type");
}

function toAssistantEventStatus(
  value: unknown
): "ACTIVE" | "PAUSED" | "CANCELLED" | undefined {
  const text = asText(value);

  if (!text) {
    return undefined;
  }

  if (text === "ACTIVE") {
    return text;
  }

  if (text === "PAUSED") {
    return text;
  }

  if (text === "CANCELLED") {
    return text;
  }

  throw new Error("Invalid assistant event status");
}

export async function executeToolCall(input: ExecuteToolCallArgs) {
  const toolCalls = input.choice.message.tool_calls || [];

  const functionToolCall = toolCalls.find((toolCall) => {
    return toolCall.type === "function";
  });

  if (!functionToolCall) {
    return null;
  }

  if (functionToolCall.type !== "function") {
    return null;
  }

  const toolName = asText(functionToolCall.function.name);
  const parsedArgs = parseArgs(functionToolCall.function.arguments || "{}");

  if (toolName === "get_news") {
    const result = await getNews(parsedArgs);

    return {
      tool: "get_news" as const,
      data: result,
    };
  }

if (toolName === "get_prayer") {
  console.log("[get_prayer parsedArgs]", parsedArgs);

  const result = await getPrayer(parsedArgs);

  return {
    tool: "get_prayer" as const,
    data: result,
  };
}

  if (toolName === "list_assistant_events") {
    const result = await listAssistantEvents({
      companyId: input.args.companyId,
      customerId: input.args.customerId,
    });

    await updateAssistantSessionMemory({
      sessionId: input.args.sessionId,
      bucket: "state",
      patch: {
        last_listed_events: result.events || [],
        pending_action: "event_followup",
        current_flow: "events",
      },
    });

    return {
      tool: "list_assistant_events" as const,
      data: result,
    };
  }

  if (toolName === "pause_event") {
    let eventId = asText(parsedArgs.eventId);

    let type: "GOSPEL" | "NEWS" | "REMINDER" | "CUSTOM" | undefined;
    if (parsedArgs.type) {
      type = toAssistantEventType(parsedArgs.type);
    }

    if (!eventId && !type) {
      const memory = await getAssistantSessionMemory(input.args.sessionId);
      const rawLastEvents = memory.state.last_listed_events;

      if (Array.isArray(rawLastEvents) && rawLastEvents.length > 0) {
        const firstEvent = rawLastEvents[0];

        if (
          firstEvent &&
          typeof firstEvent === "object" &&
          !Array.isArray(firstEvent)
        ) {
          const firstEventObject = firstEvent as Record<string, unknown>;
          eventId = asText(firstEventObject.id);
        }
      }
    }

    const result = await pauseEvent({
      companyId: input.args.companyId,
      customerId: input.args.customerId,
      eventId,
      type,
    });

    await updateAssistantSessionMemory({
      sessionId: input.args.sessionId,
      bucket: "state",
      patch: {
        last_paused_event_id: result.event.id,
        pending_action: null,
        current_flow: null,
      },
    });

    return {
      tool: "pause_event" as const,
      data: result,
    };
  }

  if (toolName === "resume_event") {
    let eventId = asText(parsedArgs.eventId);

    let type: "GOSPEL" | "NEWS" | "REMINDER" | "CUSTOM" | undefined;
    if (parsedArgs.type) {
      type = toAssistantEventType(parsedArgs.type);
    }

    if (!eventId && !type) {
      const memory = await getAssistantSessionMemory(input.args.sessionId);
      const rawLastEvents = memory.state.last_listed_events;

      if (Array.isArray(rawLastEvents) && rawLastEvents.length > 0) {
        const firstEvent = rawLastEvents[0];

        if (
          firstEvent &&
          typeof firstEvent === "object" &&
          !Array.isArray(firstEvent)
        ) {
          const firstEventObject = firstEvent as Record<string, unknown>;
          eventId = asText(firstEventObject.id);
        }
      }
    }

    const result = await resumeEvent({
      companyId: input.args.companyId,
      customerId: input.args.customerId,
      eventId,
      type,
    });

    await updateAssistantSessionMemory({
      sessionId: input.args.sessionId,
      bucket: "state",
      patch: {
        pending_action: null,
        current_flow: null,
      },
    });

    return {
      tool: "resume_event" as const,
      data: result,
    };
  }

  if (toolName === "upsert_assistant_event") {
const result = await upsertAssistantEvent({
  companyId: input.args.companyId,
  agentId: input.args.agentId,
  customerId: input.args.customerId,
  conversationId: undefined,
  type: toAssistantEventType(parsedArgs.type),
  title: asText(parsedArgs.title),
  prompt: asText(parsedArgs.prompt),
  localTime: asText(parsedArgs.localTime),
  timeExpression: asText(parsedArgs.timeExpression),
  isOneTime: parsedArgs.isOneTime === true,
  daysOfWeek: Array.isArray(parsedArgs.daysOfWeek)
    ? parsedArgs.daysOfWeek.map((value: unknown) => Number(value))
    : [],
  timezone: asText(parsedArgs.timezone || "Europe/Madrid"),
  status: toAssistantEventStatus(parsedArgs.status) || "ACTIVE",
});

    await updateAssistantSessionMemory({
      sessionId: input.args.sessionId,
      bucket: "state",
      patch: {
        pending_action: null,
        current_flow: null,
      },
    });

    return {
      tool: "upsert_assistant_event" as const,
      data: result,
    };
  }

  throw new Error("Unknown tool: " + toolName);
}