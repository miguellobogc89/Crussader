// lib/ai/whatsappAssistant.ts
import { prismaRaw } from "@/lib/prisma";
import { openai } from "@/lib/ai";
import {
  AgentActionSchema,
  AgentUnderstandingSchema,
} from "@/lib/agents/contract";

type BuildWaReplyArgs = {
  installationId: string;
  text: string;
  contactName?: string | null;
  lastConversationAt?: Date | null;
};

type BuildWaReplyResult = {
  botText: string; // provisional o pregunta si faltan datos
  understanding: unknown | null; // AgentUnderstanding validado (guardamos como unknown por compat)
  actions: unknown[]; // acciones validadas
  needs: string[]; // faltantes (máx 2). Si hay needs => actions=[]
  debug: {
    companyId: string | null;
    knowledgeUsed: number;
    mode: string;
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
    if (idx > 10) break;
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
      (Date.now() - args.lastConversationAt.getTime()) / (1000 * 60 * 60);
    if (hours >= 24) shouldGreet = true;
  } else {
    shouldGreet = true;
  }

  const mode = readAssistantMode(installation.config);

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

  const name = args.contactName ? args.contactName.trim() : "";
  const contactLine = name ? `El contacto se llama "${name}".` : "";

  //const greetRule = shouldGreet
    //? `Puedes saludar UNA sola vez al inicio (máximo una frase). Si conoces el nombre del contacto, úsalo.`
    //: `NO saludes. Entra directo al punto (no "hola", no "buenas", no "¿en qué puedo ayudarte?").`;

const systemPrompt = [
  `Eres el asistente de WhatsApp de esta empresa. Compórtate como un agente humano excelente (recepción/atención al cliente).`,
  //greetRule,

  `Contexto operativo:
   - Estás atendiendo a un cliente por chat.
   - Trabajas para la companyId actual (multi-tenant). Todo lo que consultes o ejecutes debe estar filtrado por companyId.
   - La empresa puede tener una o varias sedes (locations). Si la petición depende de la sede y no está clara, pregunta por la sede SOLO cuando sea necesario.`,
  
  `Tienes acceso a información mediante acciones backend (herramientas) que ejecutará el servidor por ti.
   Piensa y decide tú qué consultar, en qué orden y por qué, como lo haría un agente humano eficiente.`,
  
  `Objetivo:
   - Resolver la intención del cliente (información, reservar, modificar/cancelar, consultar cita, queja, hablar con alguien, etc.)
   - Minimizar fricción: pide SOLO lo imprescindible y solo cuando haga falta.
   - Si puedes ayudar con la información disponible, no hagas preguntas innecesarias.`,
  
  `Fuentes disponibles (elige tú):
   - knowledge: información pública (horarios, dirección, políticas, precios si existen, etc.).
   - service: catálogo de servicios/tratamientos por sede.
   - appointment: citas (próxima cita del cliente, disponibilidad/slots, etc.).
   - location: sedes/centros.
   - customer: cliente si hay identidad.`,
  
  `Criterio humano (muy importante):
   - No pidas fecha/hora/ubicación “por defecto”. Primero entiende qué quiere y resuelve lo resoluble.
   - Si el cliente menciona un servicio (ej: "endodoncia"), primero identifica el servicio en la base de datos (lookup service). Luego ya decides si hace falta sede/fecha.
   - Solo pregunta por sede si: (a) la empresa tiene varias sedes y (b) la respuesta o la disponibilidad cambia por sede o hay ambigüedad real.
   - Solo pregunta por fecha/hora cuando ya estés en modo reserva/disponibilidad con un servicio claro.
   - Para quejas: escucha, reconoce, pide el mínimo para registrar/derivar (nombre + detalle) y ofrece pasar a humano.`,
  
  `Privacidad y seguridad:
   - Nunca reveles datos personales ni información sensible (historiales, pagos, datos internos).
   - Si falta identificación para consultar una cita, pide el mínimo (teléfono / nombre) o deriva a canal seguro.
   - No inventes datos. Si no hay info, dilo y propone alternativa.`,
  
  `Salida estricta (obligatoria):
   Devuelve SIEMPRE un único JSON válido, sin markdown ni texto extra, con esta forma:
   {
     "botText": "...",
     "understanding": {
       "need": { "type": "info|booking|modify|status|complaint|human|other|unknown", "summary": "...", "confidence": 0.0-1.0 },
       "entities": { "service_name"?: "...", "location_hint"?: "...", "time_hint"?: "...", "customer_name"?: "...", "customer_phone"?: "..." },
       "missing": ["..."]   // máximo 2, solo imprescindibles
     },
     "actions": [ { "intent": "...", "args": { ... } } ],
     "needs": ["..."]
   }`,
  
  `Reglas del JSON:
   - "needs" debe ser igual a "understanding.missing".
   - Si "needs" NO está vacío, entonces "actions" debe ser [] y botText debe preguntar directamente por esos datos.
   - Si "actions" NO está vacío, botText debe ser provisional breve (ej: "Un momento, lo reviso.") y NO debe inventar resultados.`,
  
  `Acciones permitidas: faq_query, lookup_entity, list_options, create_record, update_record, handoff_human.`,
  `Convenciones:
   - Para buscar servicio: {"intent":"lookup_entity","args":{"entity":"service","query":"<texto>"}} (query obligatorio).
   - Para próxima cita: {"intent":"lookup_entity","args":{"entity":"appointment","scope":"next"}}.`,
  
  `Modo asistente: ${mode}.`,
].join(" ");

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
    temperature: 0.2,
    max_tokens: 450,
    messages,
  });

  const choice = completion.choices?.[0] ?? null;

  let raw = "";
  if (choice && choice.message && typeof choice.message.content === "string") {
    raw = choice.message.content.trim();
  }

  // defaults safe
  let botText = "Un momento, lo reviso.";
  let understanding: unknown | null = null;
  let actions: unknown[] = [];
  let needs: string[] = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as any;

      if (parsed && typeof parsed.botText === "string") {
        botText = parsed.botText.trim();
      }

      const uParsed = AgentUnderstandingSchema.safeParse(parsed?.understanding);
      if (uParsed.success) {
        understanding = uParsed.data;
      } else {
        understanding = null;
      }

      if (parsed && Array.isArray(parsed.actions)) {
        actions = parsed.actions;
      }

      if (parsed && Array.isArray(parsed.needs)) {
        needs = parsed.needs
          .filter((x: any) => typeof x === "string")
          .slice(0, 2);
      }
    } catch {
      // no JSON => degradamos a texto
      botText = raw;
      understanding = null;
      actions = [];
      needs = [];
    }
  }

  // Si tenemos understanding.missing, lo imponemos como needs
  if (understanding && typeof understanding === "object") {
    const anyU = understanding as any;
    if (Array.isArray(anyU.missing)) {
      needs = anyU.missing
        .filter((x: any) => typeof x === "string")
        .slice(0, 2);
    }
  }

  // Si hay needs, actions deben ser []
  if (needs.length > 0) {
    actions = [];
    if (!botText || botText === "Un momento, lo reviso.") {
      botText = "¿Me indicas un poco más de información para ayudarte?";
    }
  }

  // Valida acciones (filtra inválidas)
  const validActions: unknown[] = [];
  for (const a of actions) {
    const p = AgentActionSchema.safeParse(a);
    if (p.success) validActions.push(p.data);
  }

  // Si el modelo intentó acciones pero todas inválidas -> no ejecutamos nada
  if (actions.length > 0 && validActions.length === 0) {
    validActions.length = 0;
  }

  return {
    botText,
    understanding,
    actions: validActions,
    needs,
    debug: {
      companyId: installation.company_id ?? null,
      knowledgeUsed: sections.length,
      mode,
    },
  };
}