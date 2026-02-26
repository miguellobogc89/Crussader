// lib/ai/whatsappAssistant.ts
import { prismaRaw } from "@/lib/prisma";
import { openai } from "@/lib/ai";

type BuildWaReplyArgs = {
  installationId: string;
  text: string;
  contactName?: string | null;
};

type BuildWaReplyResult = {
  botText: string;
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

const systemPrompt = [
  `Eres el asistente por WhatsApp de esta empresa.`,
  contactLine,
  `Si contact_name existe, puedes saludar UNA vez al inicio usando exactamente ese nombre.`,
  `No uses nombres propios del usuario a menos que estén en el CONTEXTO (contact_name) o el usuario se haya presentado.`,
  `Sé breve, claro y directo.`,
  `REGLA CRÍTICA: No inventes datos. Si una respuesta requiere información que no está explícitamente en CONTEXTO, di: "No lo tengo en el knowledge." y pide el dato mínimo.`,
  `REGLA: Cuando el usuario pregunte por horarios, dirección, servicios, precios, políticas, etc., busca primero en el CONTEXTO y responde citando el contenido (parafraseado) del knowledge.`,
  `No menciones paneles internos ni rutas del dashboard.`,
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
  const choice =
    completion.choices && completion.choices[0] ? completion.choices[0] : null;
  if (choice && choice.message && choice.message.content) {
    botText = choice.message.content.trim();
  }

  if (!botText) {
    botText =
      "Ahora mismo no tengo suficiente información para ayudarte. ¿Me das un poco más de detalle?";
  }

  return {
    botText,
    debug: {
      companyId: installation.company_id ?? null,
      knowledgeUsed: sections.length,
    },
  };
}