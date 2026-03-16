// lib/crussader-assistant/reply/universalResponseStyler.ts

import { openai } from "@/lib/ai";

export type UniversalResponseStyle = "neutral" | "friendly" | "warm" | "professional";
export type UniversalResponseLength = "short" | "medium" | "long";
export type UniversalResponseEmojiLevel = "none" | "low" | "medium" | "high";
export type UniversalResponseEnthusiasm = "low" | "medium" | "high";

export type UniversalResponseStylerInput = {
  message: string;
  style: UniversalResponseStyle;
  length: UniversalResponseLength;
  enthusiasm?: UniversalResponseEnthusiasm;
  emojis?: UniversalResponseEmojiLevel;
  language?: string;
  channel?: string;
  cta?: string | null;
  brandVoice?: string | null;
  forbiddenWords?: string[];
  context?: Record<string, unknown> | null;
};

export type UniversalResponseStylerResult = {
  ok: boolean;
  text: string;
  source: "ai" | "fallback";
};

function asText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeForbiddenWords(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => String(item).trim())
    .filter((item) => item !== "");
}

function sanitizeLineBreaks(value: string): string {
  return value.replace(/\n{3,}/g, "\n\n").trim();
}

function buildSystemPrompt() {
  return [
    "Eres el módulo universal de estilizado de respuestas de Crussader Assistant.",
    "Tu trabajo es reescribir el mensaje base para que suene como un asistente humano real por WhatsApp.",
    "No decides lógica ni inventas acciones nuevas. Solo mejoras cómo suena el mensaje.",
    "Debes conservar el significado esencial del mensaje base.",
    "",
    "Reglas obligatorias:",
    "- No inventes datos.",
    "- No cambies fechas, horas, frecuencias, nombres ni hechos.",
    "- No elimines información clave del mensaje base.",
    "- No conviertas una pregunta en afirmación ni una afirmación en pregunta salvo que el contexto lo permita claramente.",
    "- Devuelve un único mensaje final listo para enviar al usuario.",
    "- No devuelvas notas, etiquetas, explicaciones ni texto técnico.",
    "- No menciones prompts, herramientas, módulos, sistemas, decisiones ni procesos internos.",
    "- Debes sonar como un asistente humano, cercano, claro y natural.",
    "- Prioriza frases naturales como: 'OK, te despertaré...', 'Perfecto, te lo recordaré...', 'Vale, te enviaré...'.",
    "- Evita completamente lenguaje de sistema como: activar, preparar, configurar, gestionar, registrar, suscripción, suscribirte, suscribo, suscribir.",
    "- Nunca hagas que el mensaje suene a pago, plan o alta de servicio.",
    "- Si el mensaje trata sobre recurrencias, exprésalo como ayuda del asistente: recordatorios, avisos, envíos, acompañamiento.",
    "- No pongas nombres de tareas entre comillas salvo que sea estrictamente necesario.",
    "- Si el nombre de una tarea suena artificial o demasiado técnico, suaviza la frase para que suene natural sin cambiar el significado.",
    "- Si el mensaje base es algo como despertar cada día, prefiere frases tipo 'OK, te despertaré todos los días a las 8'.",
    "- Si el mensaje base es sobre enviar evangelio u otro contenido periódico, prefiere frases tipo 'Perfecto, te enviaré el evangelio todos los días a las 7'.",
    "- Si se pide longitud short, sé breve y directo.",
    "- Si emojis es none, no uses emojis.",
    "- Si hay forbiddenWords, no uses ninguna de esas palabras.",
    "- Devuelve solo el texto final."
  ].join("\n");
}

function buildUserPrompt(input: UniversalResponseStylerInput) {
  return JSON.stringify(
    {
      instruction: "Rewrite the base message so it sounds like a natural human assistant message for WhatsApp.",
      input: {
        message: input.message,
        style: input.style,
        length: input.length,
        enthusiasm: input.enthusiasm || "medium",
        emojis: input.emojis || "none",
        language: input.language || "es",
        channel: input.channel || "generic",
        cta: input.cta || null,
        brandVoice: input.brandVoice || null,
        forbiddenWords: normalizeForbiddenWords(input.forbiddenWords),
        context: input.context || null
      }
    },
    null,
    2
  );
}

function applyBasicLengthRule(
  text: string,
  length: UniversalResponseLength
): string {
  const clean = sanitizeLineBreaks(text);

  if (length === "long") {
    return clean;
  }

  if (length === "medium") {
    return clean;
  }

  const firstParagraph = clean.split("\n")[0].trim();

  if (firstParagraph) {
    return firstParagraph;
  }

  return clean;
}

function stripForbiddenWords(text: string, forbiddenWords: string[]): string {
  let result = text;

  for (const word of forbiddenWords) {
    const cleanWord = word.trim();

    if (!cleanWord) {
      continue;
    }

    const escaped = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    result = result.replace(regex, "");
  }

  result = result.replace(/\s{2,}/g, " ").trim();
  result = result.replace(/\n {1,}/g, "\n").trim();

  return result;
}

function applyEmojiFallback(
  text: string,
  emojis: UniversalResponseEmojiLevel
): string {
  if (emojis === "none") {
    return text.replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
      ""
    ).replace(/\s{2,}/g, " ").trim();
  }

  return text;
}

function buildFallbackText(input: UniversalResponseStylerInput): string {
  let text = sanitizeLineBreaks(input.message);

  const cta = asText(input.cta);
  const forbiddenWords = normalizeForbiddenWords(input.forbiddenWords);
  const emojis = input.emojis || "none";

  if (cta) {
    text = `${text}\n\n${cta}`.trim();
  }

  text = applyBasicLengthRule(text, input.length);
  text = stripForbiddenWords(text, forbiddenWords);
  text = applyEmojiFallback(text, emojis);
  text = sanitizeLineBreaks(text);

  return text;
}

export async function universalResponseStyler(
  input: UniversalResponseStylerInput
): Promise<UniversalResponseStylerResult> {
  const message = asText(input.message);

  if (!message) {
    return {
      ok: false,
      text: "",
      source: "fallback"
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt()
        },
        {
          role: "user",
          content: buildUserPrompt(input)
        }
      ]
    });

    const content = response.choices?.[0]?.message?.content;
    const text = asText(content);

    if (!text) {
      return {
        ok: true,
        text: buildFallbackText(input),
        source: "fallback"
      };
    }

    let finalText = sanitizeLineBreaks(text);
    finalText = stripForbiddenWords(
      finalText,
      normalizeForbiddenWords(input.forbiddenWords)
    );
    finalText = applyEmojiFallback(finalText, input.emojis || "none");
    finalText = applyBasicLengthRule(finalText, input.length);
    finalText = sanitizeLineBreaks(finalText);

    if (!finalText) {
      return {
        ok: true,
        text: buildFallbackText(input),
        source: "fallback"
      };
    }

    return {
      ok: true,
      text: finalText,
      source: "ai"
    };
  } catch (error) {
    console.error("[reply] universalResponseStyler failed", error);

    return {
      ok: true,
      text: buildFallbackText(input),
      source: "fallback"
    };
  }
}