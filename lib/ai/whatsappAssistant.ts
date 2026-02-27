// lib/ai/whatsappAssistant.ts
import { prismaRaw } from "@/lib/prisma";
import { openai } from "@/lib/ai";

type BuildWaReplyArgs = {
  installationId: string;
  text: string;
  contactName?: string | null;
  lastConversationAt?: Date | null;
};

type BuildWaReplyResult = {
  botText: string;
  action?: unknown;
  debug: {
    companyId: string | null;
    knowledgeUsed: number;
  };
};

type AssistantMode = "single" | "multi" | "single_with_override";

function readAssistantMode(config: unknown): AssistantMode {
  if (!config || typeof config !== "object") return "single";
  const anyCfg = config as any;
  const assistant = anyCfg.assistant;
  if (!assistant || typeof assistant !== "object") return "single";

  const mode = (assistant as any).mode;
  if (mode === "multi") return "multi";
  if (mode === "single_with_override") return "single_with_override";
  return "single";
}

function buildKnowledgeContextFromSections(
  sections: Array<{ title: string | null; content: string | null }>
) {
  const parts: string[] = [];
  let idx = 1;

  for (const s of sections) {
    const title = (s.title ?? "").trim();
    const content = (s.content ?? "").trim();
    if (!title && !content) continue;

    parts.push(
      `### Section ${idx}\nTitle: ${title || "(sin título)"}\nContent:\n${content}`
    );
    idx += 1;

    if (idx > 10) break; // hard cap
  }

  return parts.join("\n\n").slice(0, 5000);
}

export async function buildWhatsappAssistantReply(
  args: BuildWaReplyArgs
): Promise<BuildWaReplyResult> {
  const text = (args.text || "").trim();
  if (!args.installationId || !text) {
    throw new Error("Missing installationId or text");
  }

  const installation = await prismaRaw.integration_installation.findUnique({
    where: { id: args.installationId },
    select: {
      id: true,
      company_id: true,
      location_id: true,
      provider: true,
      config: true,
    },
  });

  if (!installation) {
    throw new Error("Installation not found");
  }

  let shouldGreet = false;

  if (args.lastConversationAt) {
    const hours =
      (Date.now() - args.lastConversationAt.getTime()) /
      (1000 * 60 * 60);

    if (hours >= 24) {
      shouldGreet = true;
    }
  } else {
    shouldGreet = true;
  }

  const mode = readAssistantMode(installation.config);

  // ✅ SOURCE OF TRUTH: KnowledgeSections (lo que editas en /dashboard/knowledge)
  // WhatsApp = canal público → solo PUBLIC
  const sections = await prismaRaw.knowledgeSection.findMany({
    where: {
      companyId: installation.company_id,
      isActive: true,
      visibility: "PUBLIC",
    },
    orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
    select: { title: true, content: true },
    take: 20,
  });

  const knowledgeContext = buildKnowledgeContextFromSections(sections);

  let contactLine = "";
  const name = args.contactName ? args.contactName.trim() : "";
  if (name) {
    contactLine = `El contacto se llama "${name}".`;
  }

const greetRule = shouldGreet
  ? `Puedes saludar UNA sola vez al inicio (máximo una frase). Si conoces el nombre del contacto, úsalo.`
  : `NO saludes. Entra directo al punto (no "hola", no "buenas", no "¿en qué puedo ayudarte?").`;

const systemPrompt = [
  `Eres el asistente por WhatsApp de esta empresa. Estilo: profesional, cercano y eficiente.`,
  greetRule,
  `No uses nombres propios del usuario a menos que estén en el contexto del contacto o el usuario se haya presentado.`,
  `Responde en español, frases cortas, sin relleno.`,
  `Nunca inventes datos. Si no estás seguro, dilo con naturalidad: "No dispongo de esa información ahora mismo."`,
  `Si el usuario pide información sensible o privada (datos personales, historiales, pagos, detalles internos), responde: "Por privacidad, no puedo facilitar esa información por WhatsApp." y ofrece una alternativa segura (llamada, recepción, email, o venir a la clínica).`,
  `Si detectas bromas, insultos, spam o peticiones malintencionadas, corta educadamente y redirige: "Puedo ayudarte con consultas reales sobre la clínica y citas." Si insiste, termina con una frase y no escales el conflicto.`,
  `Cuando falten datos para ayudar, pide SOLO el dato mínimo imprescindible (uno o dos como máximo).`,
  `No menciones herramientas internas, paneles, bases de datos ni procesos internos.`,
  `Tu objetivo es: resolver dudas habituales y guiar al usuario para reservar/confirmar/cancelar una cita de forma simple.`,
  `Devuelve SIEMPRE una única salida en JSON válido (sin markdown, sin texto extra).`,
  `Formato exacto: {"botText":"...","action":{...} }`,
  `Si NO hay acción que ejecutar, devuelve: {"botText":"...","action":null}`,
  `Si el usuario habla de cita/reserva/disponibilidad/cancelar/confirmar/reprogramar, rellena action con un intent adecuado.`,
  `Intents permitidos: faq_query, lookup_entity, list_options, create_record, update_record, handoff_human.`,
  `Modo asistente: ${mode}.`,
]
  .filter((s) => Boolean(s))
  .join(" ");

  const messages: Array<{ role: "system" | "user"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  if (knowledgeContext) {
    messages.push({
      role: "system",
      content: `CONTEXT START\n### KNOWLEDGE (PUBLIC)\n${knowledgeContext}\nCONTEXT END`,
    });
  }

  messages.push({ role: "user", content: text });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 350,
    messages,
  });

  let botText = "";
  let action: unknown = null;

  const choice =
    completion.choices && completion.choices[0] ? completion.choices[0] : null;

  let raw = "";
  if (choice && choice.message && choice.message.content) {
    raw = choice.message.content.trim();
  }

  // Intentamos parsear JSON (modo contrato)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as any;

      if (parsed && typeof parsed.botText === "string") {
        botText = parsed.botText.trim();
      }

      if (parsed && Object.prototype.hasOwnProperty.call(parsed, "action")) {
        action = parsed.action;
      }
    } catch {
      // Fallback: si el modelo no devuelve JSON, tratamos raw como texto normal
      botText = raw;
      action = null;
    }
  }

  if (!botText) {
    botText =
      "Ahora mismo no tengo suficiente información para ayudarte. ¿Me das un poco más de detalle?";
  }

  return {
    botText,
    action,
    debug: {
      companyId: installation.company_id ?? null,
      knowledgeUsed: sections.length,
    },
  };
}