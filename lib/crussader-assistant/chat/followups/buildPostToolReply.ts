// lib/crussader-assistant/chat/followups/buildPostToolReply.ts

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

export async function buildPostToolReply(
  args: BuildPostToolReplyArgs
): Promise<PostToolReplyResult> {

  const { userText, memory, toolResult } = args;

  if (toolResult.tool === "get_news") {

    const items = toolResult.data?.items || [];

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

if (toolResult.tool === "get_prayer") {
  const rawItems = toolResult.data?.items;
  const items = Array.isArray(rawItems) ? rawItems : [];

  const singleItem = toolResult.data?.item;

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

if (toolResult.tool === "list_assistant_events") {
  const events = Array.isArray(toolResult.data?.events)
    ? toolResult.data.events
    : [];

  if (events.length === 0) {
    return {
      botText: "Ahora mismo no tienes ningún envío programado.",
      internal: null,
    };
  }

  const lines = events.slice(0, 10).map((event: any, index: number) => {
    const raw = String(event.local_time || "");
    const time = raw.length >= 16 ? raw.slice(11, 16) : "--:--";
    return `${index + 1}. ${event.title} — ${time}`;
  });

  if (events.length === 1) {
    return {
      botText: `Tienes programado ${events[0].title} a las ${String(events[0].local_time || "").slice(11, 16)}.`,
      internal: null,
    };
  }

  return {
    botText: `Tienes estos envíos programados:\n${lines.join("\n")}`,
    internal: null,
  };
}

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: baseSystemPrompt },
      { role: "system", content: buildMemoryBlock(memory) },
      {
        role: "system",
        content: `
      Evento actualizado correctamente.
      action: ${toolResult.data.kind}
      eventId: ${toolResult.data.event.id}
      `,
            },
            { role: "user", content: userText },
          ],
          max_tokens: 180,
        });

if (toolResult.tool === "upsert_assistant_event") {
  const event = toolResult.data?.event;
  const title = String(event?.title || "").trim();
  const runAt = event?.run_at ? new Date(event.run_at) : null;
  const localTimeRaw = String(event?.local_time || "").trim();

  let botText = "Hecho, queda programado.";

  if (runAt && !Number.isNaN(runAt.getTime())) {
    botText = "Hecho, queda programado.";
  } else if (localTimeRaw) {
    const parts = localTimeRaw.split(":");
    const hour = parts[0] ? parts[0].padStart(2, "0") : "00";
    const minute = parts[1] ? parts[1].padStart(2, "0") : "00";
    botText = `Hecho, queda programado a las ${hour}:${minute}.`;
  }

  if (title.toLowerCase().includes("cumple")) {
    botText = "Hecho, te felicitaré en el momento indicado 🎉";
  }

  return {
    botText,
    internal: {
      kind: "EVENT_UPSERT",
      action: toolResult.data.kind as "CREATED" | "UPDATED",
      eventId: String(toolResult.data.event.id),
    },
  };
}

if (toolResult.tool === "pause_event") {
  const title = String(toolResult.data?.event?.title || "ese envío").trim();

  return {
    botText: `He pausado ${title}. Si quieres reactivarlo en cualquier momento, avísame.`,
    internal: null,
  };
}

if (toolResult.tool === "resume_event") {
  const title = String(toolResult.data?.event?.title || "ese envío").trim();

  return {
    botText: `Perfecto, he reactivado ${title}.`,
    internal: null,
  };
}

  return {
    botText: String(completion.choices?.[0]?.message?.content || "OK").trim(),
    internal: null,
  };
}