"use server";

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type Slots = {
  name?: string;
  phone?: string;
  availability?: string; // texto libre tipo "tardes salvo viernes"
};
export type TurnInference = {
  intent: "provide_data" | "change_goal" | "question" | "smalltalk" | "confirm" | "cancel" | "other";
  slotUpdates: Partial<Slots>;
};

type IntroCtx = {
  greeting: string;
  companyName: string;
  companyShort: string;
};

type ReplyCtx = IntroCtx & {
  phase: "INTRO" | "INTENT" | "COLLECT" | "CONFIRM" | "END";
  slots: Slots;
};

export async function generateIntroFromPrompt({
  prompt,
  ctx,
  model = "gpt-4o-mini",
  temperature = 0.4,
  maxTokens = 120,
}: {
  prompt: string;
  ctx: IntroCtx;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const system = [
    "Eres un recepcionista virtual amable y profesional.",
    "Responde SIEMPRE en español neutro.",
    "Sé breve: 1–2 frases como máximo.",
    "No menciones que eres una IA.",
  ].join(" ");

  const user = [
    `Instrucciones de la fase: "${prompt}"`,
    `Contexto: saludo="${ctx.greeting}", empresa="${ctx.companyShort}" (nombre largo="${ctx.companyName}").`,
    "Si las instrucciones no especifican un nombre, elige uno anglosajón femenino natural.",
    "Si no hay datos de clima, haz un comentario ligero/neutral sobre el tiempo (sin inventar datos concretos).",
  ].join("\n");

  const resp = await openai.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return (
    resp.choices?.[0]?.message?.content?.trim() ||
    `${ctx.greeting}. Has llamado a ${ctx.companyShort}. ¿En qué puedo ayudarte?`
  );
}

export async function generateReplyFromPrompt({
  stagePrompt,
  messages,
  ctx,
  model = "gpt-4o-mini",
  temperature = 0.5,
  maxTokens = 220,
}: {
  stagePrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  ctx: ReplyCtx;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const system = [
    "Eres un recepcionista virtual amable y profesional de una clínica de láser/estética.",
    "Responde SIEMPRE en español neutro.",
    "No eres médico: no des diagnósticos ni consejos clínicos.",
    "Puedes agendar citas y proponer llamada/visita según el caso.",
    "Sigue la fase actual, pero si el usuario aporta o corrige datos, prioriza capturarlos y confirma el cambio. Luego vuelve al objetivo anterior.",
    "Sé concreto, 1–3 frases. No menciones que eres una IA.",
  ].join(" ");

  const steering = [
    `Fase actual: ${ctx.phase}`,
    `Slots actuales: ${JSON.stringify(ctx.slots)}`,
    `Empresa: "${ctx.companyName}" (alias "${ctx.companyShort}"). Saludo base: "${ctx.greeting}".`,
    `Instrucciones de la fase: "${stagePrompt}"`,
  ].join("\n");

  const resp = await openai.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: steering },
      ...messages,
    ],
  });

  return resp.choices?.[0]?.message?.content?.trim() || "Claro, ¿podrías darme un poco más de detalle?";
}

/** Clasificador de turno: intención + extracción leve de slots (name/phone/availability) */
export async function classifyTurn({
  userText,
  ctx,
  model = "gpt-4o-mini",
}: {
  userText: string;
  ctx: { companyShort: string };
  model?: string;
}): Promise<TurnInference> {
  const system = [
    "Eres un analizador de mensajes. Devuelves un JSON compacto con {intent, slotUpdates}.",
    "Intents: provide_data | change_goal | question | smalltalk | confirm | cancel | other",
    "slotUpdates: { name?, phone?, availability? } si detectas esos campos.",
    "No inventes. Si no lo ves claro, deja slotUpdates vacío.",
    "Responde SOLO el JSON sin comentarios.",
  ].join(" ");

  const user = [
    `Texto: "${userText}"`,
    `Empresa: "${ctx.companyShort}"`,
    `Ejemplos:`,
    `- "Mi nombre es Ana y mi teléfono es 612345678" -> {intent:"provide_data", slotUpdates:{name:"Ana", phone:"612345678"}}`,
    `- "Mejor el martes por la tarde" -> {intent:"provide_data", slotUpdates:{availability:"martes por la tarde"}}`,
    `- "Te doy el teléfono del trabajo mejor, 914112233" -> {intent:"provide_data", slotUpdates:{phone:"914112233"}}`,
    `- "Quiero cancelar la cita" -> {intent:"change_goal"}`,
  ].join("\n");

  const resp = await openai.chat.completions.create({
    model,
    temperature: 0,
    max_tokens: 120,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = resp.choices?.[0]?.message?.content?.trim() || `{"intent":"other","slotUpdates":{}}`;
  try {
    const parsed = JSON.parse(raw);
    return {
      intent: parsed.intent || "other",
      slotUpdates: parsed.slotUpdates || {},
    };
  } catch {
    return { intent: "other", slotUpdates: {} };
  }
}