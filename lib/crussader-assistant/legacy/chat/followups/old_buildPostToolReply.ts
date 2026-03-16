// lib/crussader-assistant/chat/old_followups/buildPostToolReply.ts

import { openai } from "@/lib/ai";
import { baseSystemPrompt } from "../prompts/baseSystemPrompt";
import { buildMemoryBlock } from "../prompts/buildMemoryBlock";

export type PostToolReplyResult = {
  botText: string;
  internal: {
    kind: "EVENT_UPSERT";
    action: "CREATED" | "UPDATED";
    eventId: string;
  } | null;
};

type BuildPostToolReplyArgs = {
  userText: string;
  memory: {
    profile: Record<string, unknown>;
    state: Record<string, unknown>;
  };
  toolResult: any;
};

function formatEventLocalTime(value: unknown) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) {
    return raw.slice(0, 5);
  }

  if (/^\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }

  if (raw.length >= 16 && raw.includes("T")) {
    return raw.slice(11, 16);
  }

  return "";
}

function getToolName(toolResult: any) {
  return String(toolResult?.tool || "").trim();
}

function getTopLevelData(toolResult: any) {
  return toolResult?.data || {};
}

function getNestedData(toolResult: any) {
  return toolResult?.data?.data || {};
}

function getBestEvent(toolResult: any) {
  return (
    toolResult?.data?.event ||
    toolResult?.data?.data?.event ||
    null
  );
}

function getBestEventId(toolResult: any) {
  const event = getBestEvent(toolResult);
  return String(event?.id || "");
}

function getBestEventsArray(toolResult: any) {
  const directEvents = toolResult?.data?.events;
  if (Array.isArray(directEvents)) {
    return directEvents;
  }

  const nestedEvents = toolResult?.data?.data?.events;
  if (Array.isArray(nestedEvents)) {
    return nestedEvents;
  }

  return [];
}

function getBestKind(toolResult: any) {
  return String(
    toolResult?.data?.kind ||
      toolResult?.data?.data?.kind ||
      ""
  ).trim();
}

function getBestOperation(toolResult: any) {
  return String(toolResult?.data?.operation || "").trim();
}

function getBestMessageForUser(toolResult: any) {
  return String(toolResult?.data?.messageForUser || "").trim();
}

export async function buildPostToolReply(
  args: BuildPostToolReplyArgs
): Promise<PostToolReplyResult> {
  const { userText, memory, toolResult } = args;
  const toolName = getToolName(toolResult);

  if (toolName === "get_news") {
    const items = getTopLevelData(toolResult)?.items || [];

    if (items.length === 0) {
      return {
        botText: "No he encontrado noticias recientes sobre eso.",
        internal: null,
      };
    }

    const lines = items.slice(0, 5).map((n: any) => {
      return `• ${n.title}`;
    });

    return {
      botText: `Estas son algunas noticias recientes:\n\n${lines.join("\n")}`,
      internal: null,
    };
  }

  if (toolName === "get_prayer") {
    const rawItems = getTopLevelData(toolResult)?.items;
    const items = Array.isArray(rawItems) ? rawItems : [];

    const singleItem = getTopLevelData(toolResult)?.item;

    if (items.length === 0 && !singleItem) {
      return {
        botText: "No he podido obtener la liturgia de hoy.",
        internal: null,
      };
    }

    const normalizedItems = items.length > 0 ? items : [singleItem];
    const parts: string[] = [];

    for (const item of normalizedItems) {
      if (!item) {
        continue;
      }

      if (item.part === "all" && item.data) {
        if (item.data.primera_lectura) {
          parts.push(
            `📖 *${String(item.data.primera_lectura.title || "").trim()}*\n_${String(item.data.primera_lectura.reference || "").trim()}_\n\n${String(item.data.primera_lectura.text || "").trim()}`
          );
        }

        if (item.data.salmo) {
          let salmoBody = String(item.data.salmo.text || "").trim();
          const salmoReference = String(item.data.salmo.reference || "").trim();

          if (salmoReference && salmoBody.startsWith(salmoReference)) {
            salmoBody = salmoBody.slice(salmoReference.length).trim();
          }

          const lines = salmoBody.split("\n");
          const formatted: string[] = [];
          let buffer: string[] = [];

          for (const line of lines) {
            const l = line.trim();

            if (!l) {
              continue;
            }

            if (l.startsWith("R/.")) {
              if (buffer.length > 0) {
                formatted.push(`_V/. ${buffer.join(" ")}_`);
                buffer = [];
              }

              formatted.push(`*${l}*`);
              continue;
            }

            if (l.startsWith("V/.")) {
              if (buffer.length > 0) {
                formatted.push(`_V/. ${buffer.join(" ")}_`);
                buffer = [];
              }

              buffer.push(l.replace(/^V\/\.\s*/, ""));
              continue;
            }

            buffer.push(l);
          }

          if (buffer.length > 0) {
            formatted.push(`_V/. ${buffer.join(" ")}_`);
          }

          parts.push(
            `📜 *${String(item.data.salmo.title || "").trim()}*\n_${salmoReference}_\n\n${formatted.join("\n\n")}`
          );
        }

        if (item.data.evangelio) {
          const gospelTitle = String(item.data.evangelio.title || "").trim();
          const gospelReference = String(item.data.evangelio.reference || "").trim();
          const gospelBody = String(item.data.evangelio.text || "")
            .split("\n")
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0)
            .join(" ");

          parts.push(
            `✝️ *${gospelTitle}*\n_${gospelReference}_\n\n${gospelBody}`
          );
        }

        continue;
      }

      const title = String(item.title || "").trim();
      const reference = String(item.reference || "").trim();
      const text = String(item.text || "").trim();

      let icon = "📖";

      if (item.part === "evangelio") {
        icon = "✝️";
      }

      if (item.part === "salmo") {
        icon = "📜";
      }

      if (item.part === "primera_lectura") {
        icon = "📖";
      }

      let body = text;

      if (item.part === "salmo") {
        if (reference && body.startsWith(reference)) {
          body = body.slice(reference.length).trim();
        }

        const lines = body.split("\n");
        const formatted: string[] = [];
        let buffer: string[] = [];

        for (const line of lines) {
          const l = line.trim();

          if (!l) {
            continue;
          }

          if (l.startsWith("R/.")) {
            if (buffer.length > 0) {
              formatted.push(`_V/. ${buffer.join(" ")}_`);
              buffer = [];
            }

            formatted.push(`*${l}*`);
            continue;
          }

          if (l.startsWith("V/.")) {
            if (buffer.length > 0) {
              formatted.push(`_V/. ${buffer.join(" ")}_`);
              buffer = [];
            }

            buffer.push(l.replace(/^V\/\.\s*/, ""));
            continue;
          }

          buffer.push(l);
        }

        if (buffer.length > 0) {
          formatted.push(`_V/. ${buffer.join(" ")}_`);
        }

        body = formatted.join("\n\n");
      }

      if (item.part === "evangelio") {
        const lines = body
          .split("\n")
          .map((l: string) => l.trim())
          .filter((l: string) => l.length > 0);

        let intro = "";
        let outro = "";
        const middle: string[] = [];

        for (const line of lines) {
          if (line.toLowerCase().startsWith("lectura del santo evangelio")) {
            intro = line;
            continue;
          }

          if (line.toLowerCase().startsWith("palabra del señor")) {
            outro = line;
            continue;
          }

          middle.push(line);
        }

        body =
          `${intro}\n\n` +
          `${middle.join(" ")}\n\n` +
          `${outro}`;
      }

      parts.push(
        `${icon} *${title}*\n_${reference}_\n\n${body}`
      );
    }

    return {
      botText: parts.join("\n\n"),
      internal: null,
    };
  }

  if (toolName === "list_assistant_events" || toolName === "list_events") {
    const events = getBestEventsArray(toolResult);

    if (events.length === 0) {
      return {
        botText: "Ahora mismo no tienes ningún envío programado.",
        internal: null,
      };
    }

    const lines = events.slice(0, 10).map((event: any, index: number) => {
      const time = formatEventLocalTime(event.local_time);
      return `${index + 1}. ${event.title}${time ? ` — ${time}` : ""}`;
    });

    if (events.length === 1) {
      const oneTime = formatEventLocalTime(events[0].local_time);
      return {
        botText: oneTime
          ? `Tienes programado ${events[0].title} a las ${oneTime}.`
          : `Tienes programado ${events[0].title}.`,
        internal: null,
      };
    }

    return {
      botText: `Tienes estos envíos programados:\n${lines.join("\n")}`,
      internal: null,
    };
  }

  if (toolName === "list_paused_events") {
    const events = getBestEventsArray(toolResult);

    if (events.length === 0) {
      return {
        botText: "Ahora mismo no tienes envíos pausados.",
        internal: null,
      };
    }

    const lines = events.slice(0, 10).map((event: any, index: number) => {
      const time = formatEventLocalTime(event.local_time);
      return `${index + 1}. ${event.title}${time ? ` — ${time}` : ""}`;
    });

    if (events.length === 1) {
      const oneTime = formatEventLocalTime(events[0].local_time);
      return {
        botText: oneTime
          ? `Tienes pausado ${events[0].title} de las ${oneTime}.`
          : `Tienes pausado ${events[0].title}.`,
        internal: null,
      };
    }

    return {
      botText: `Tienes estos envíos pausados:\n${lines.join("\n")}`,
      internal: null,
    };
  }

  if (
    toolName === "upsert_assistant_event" ||
    toolName === "create_event" ||
    toolName === "update_event"
  ) {
    const data = getTopLevelData(toolResult);
    const kind = getBestKind(toolResult);
    const event = getBestEvent(toolResult);
    const eventId = getBestEventId(toolResult);

    if (kind === "LIMIT_REACHED") {
      return {
        botText:
          "Ahora mismo ya tienes el máximo de envíos programados. Si quieres, puedo ayudarte a cambiar uno existente.",
        internal: null,
      };
    }

    if (kind === "NEEDS_DECISION") {
      const existingEvent = data?.existingEvent || data?.existing_event || event;
      const title = String(existingEvent?.title || "ese envío").trim();
      const time = formatEventLocalTime(existingEvent?.local_time);

      return {
        botText: time
          ? `Ya tienes ${title} programado a las ${time}. ¿Quieres que cambie la hora o prefieres mantenerlo así?`
          : `Ya tienes ${title} programado. ¿Quieres que cambie la hora o prefieres mantenerlo así?`,
        internal: null,
      };
    }

    if (kind === "CREATED") {
      const title = String(event?.title || "").trim();
      const runAt = event?.run_at ? new Date(event.run_at) : null;
      const localTime = formatEventLocalTime(event?.local_time);

      let botText = "Hecho, queda programado.";

      if (runAt && !Number.isNaN(runAt.getTime())) {
        botText = "Hecho, queda programado.";
      } else if (localTime) {
        botText = `Hecho, queda programado a las ${localTime}.`;
      }

      if (title.toLowerCase().includes("cumple")) {
        botText = "Hecho, te felicitaré en el momento indicado 🎉";
      }

      return {
        botText,
        internal: eventId
          ? {
              kind: "EVENT_UPSERT",
              action: "CREATED",
              eventId,
            }
          : null,
      };
    }

    if (kind === "UPDATED") {
      return {
        botText: "Hecho, lo he actualizado.",
        internal: eventId
          ? {
              kind: "EVENT_UPSERT",
              action: "UPDATED",
              eventId,
            }
          : null,
      };
    }

    return {
      botText: "No he podido dejarlo programado.",
      internal: null,
    };
  }

  if (toolName === "pause_event") {
    const event = getBestEvent(toolResult);
    const title = String(event?.title || "ese envío").trim();

    return {
      botText: `He pausado ${title}. Si quieres reactivarlo en cualquier momento, avísame.`,
      internal: null,
    };
  }

  if (toolName === "resume_event") {
    const event = getBestEvent(toolResult);
    const title = String(event?.title || "ese envío").trim();

    return {
      botText: `Perfecto, he reactivado ${title}.`,
      internal: null,
    };
  }

  const eventId = getBestEventId(toolResult);
  const kind = getBestKind(toolResult);
  const operation = getBestOperation(toolResult);
  const messageForUser = getBestMessageForUser(toolResult);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: baseSystemPrompt },
      { role: "system", content: buildMemoryBlock(memory) },
      {
        role: "system",
        content: `
Resultado de tool recibido correctamente.
tool: ${toolName}
kind: ${kind}
operation: ${operation}
eventId: ${eventId}
messageForUser: ${messageForUser}
`,
      },
      { role: "user", content: userText },
    ],
    max_tokens: 180,
  });

  return {
    botText: String(completion.choices?.[0]?.message?.content || "OK").trim(),
    internal: null,
  };
}