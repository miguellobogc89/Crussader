// lib/agents/chat/conversationRouter.ts
import { openai } from "@/lib/ai";
import { getSessionMemory } from "@/lib/agents/memory/getSessionMemory";
import { updateSessionMemory } from "@/lib/agents/memory/updateSessionMemory";

export type RootIntent =
  | "information_request"
  | "appointment_management"
  | "human_handoff"
  | "complaint_intake"
  | "out_of_scope";

export type ConversationRouterResult = {
  intent: RootIntent | null;
  confidence: "low" | "medium" | "high";
  needsClarification: boolean;
  clarificationQuestion: string | null;
};

function safeTrim(v: unknown): string {
  return String(v || "").trim();
}

function normalizeIntent(v: unknown): RootIntent | null {
  const s = safeTrim(v);

  if (s === "information_request") return "information_request";
  if (s === "appointment_management") return "appointment_management";
  if (s === "human_handoff") return "human_handoff";
  if (s === "complaint_intake") return "complaint_intake";
  if (s === "out_of_scope") return "out_of_scope";

  return null;
}

function normalizeConfidence(v: unknown): "low" | "medium" | "high" {
  const s = safeTrim(v);

  if (s === "high") return "high";
  if (s === "medium") return "medium";
  return "low";
}

function buildRouterMemoryBlock(memory: {
  profile: Record<string, unknown>;
  state: Record<string, unknown>;
}): string {
  const state = memory.state || {};

  const rootIntent =
    typeof state.rootIntent === "string" ? state.rootIntent.trim() : "";
  const flow =
    typeof state.flow === "string" ? state.flow.trim() : "";
  const step =
    typeof state.step === "string" ? state.step.trim() : "";

  const lines: string[] = [];
  lines.push("Estado actual de memoria:");
  lines.push("- rootIntent: " + (rootIntent || "vacío"));
  lines.push("- flow: " + (flow || "vacío"));
  lines.push("- step: " + (step || "vacío"));

  return lines.join("\n");
}

export async function conversationRouter(args: {
  sessionId: string;
  userText: string;
}): Promise<ConversationRouterResult> {
  const sessionId = safeTrim(args.sessionId);
  const userText = safeTrim(args.userText);

  if (!sessionId) throw new Error("Missing sessionId");
  if (!userText) throw new Error("Missing userText");

  const memory = await getSessionMemory(sessionId);
  const memoryBlock = buildRouterMemoryBlock(memory);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: [
          "Clasifica el mensaje del usuario en una única intención raíz.",
          "",
          "Intenciones válidas:",
          "- information_request: el usuario pide información, hace preguntas o consulta servicios, horarios, precios o dudas generales.",
          "- appointment_management: el usuario quiere pedir, cambiar, cancelar, confirmar o consultar una cita.",
          "- human_handoff: el usuario quiere hablar con una persona humana o que lo llamen.",
          "- complaint_intake: el usuario expresa una queja, incidencia, mala experiencia o reclamación relacionada con la clínica.",
          "- out_of_scope: cualquier cosa que no encaje en las categorías anteriores.",
          "",
          "Reglas:",
          "- Si el mensaje habla de cita de cualquier forma, usa appointment_management.",
          "- Si el usuario pide hablar con alguien del centro, usa human_handoff.",
          "- Si el mensaje es una queja o reclamación, usa complaint_intake.",
          "- Si es una consulta o duda normal, usa information_request.",
          "- Si no encaja, usa out_of_scope.",
          "- Si no está suficientemente claro, devuelve needsClarification=true y una pregunta breve.",
          "- Responde solo JSON válido.",
          "",
          'Formato exacto:',
          '{"intent":"information_request|appointment_management|human_handoff|complaint_intake|out_of_scope|null","confidence":"low|medium|high","needsClarification":true,"clarificationQuestion":"string|null"}',
        ].join("\n"),
      },
      {
        role: "system",
        content: memoryBlock,
      },
      {
        role: "user",
        content: userText,
      },
    ],
    max_tokens: 140,
  });

  const raw = safeTrim(completion.choices?.[0]?.message?.content);

  let parsed: any = null;

  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  const intent = parsed ? normalizeIntent(parsed.intent) : null;
  const confidence = parsed ? normalizeConfidence(parsed.confidence) : "low";
  const needsClarification = Boolean(parsed && parsed.needsClarification);
  const clarificationQuestionRaw =
    parsed && typeof parsed.clarificationQuestion === "string"
      ? parsed.clarificationQuestion
      : "";

  const clarificationQuestion = safeTrim(clarificationQuestionRaw) || null;

  const result: ConversationRouterResult = {
    intent,
    confidence,
    needsClarification,
    clarificationQuestion,
  };

  const statePatch: Record<string, unknown> = {
    rootIntent: intent,
    rootIntentConfidence: confidence,
    rootIntentNeedsClarification: needsClarification,
    rootIntentClarificationQuestion: clarificationQuestion,
  };

  if (intent === "appointment_management") {
    statePatch.flow = "appointment_management";
  }

  if (intent === "information_request") {
    statePatch.flow = "information_request";
  }

  if (intent === "human_handoff") {
    statePatch.flow = "human_handoff";
  }

  if (intent === "complaint_intake") {
    statePatch.flow = "complaint_intake";
  }

  if (intent === "out_of_scope") {
    statePatch.flow = "out_of_scope";
  }

  await updateSessionMemory({
    sessionId,
    bucket: "state",
    patch: statePatch,
  });

  return result;
}