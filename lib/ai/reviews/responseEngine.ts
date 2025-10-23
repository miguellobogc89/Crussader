// lib/ai/responseEngine.ts
// Unifica: createAIResponseForReview + engine + generateReviewResponse (LEGACY)
// Mantén los demás archivos sin tocar todavía. En el siguiente paso los iremos apuntando aquí.

import { completeOpenAI } from "@/lib/ai/providers/openai";

// Types suaves para no romper nada ahora mismo (afinaremos luego)
type AnyDict = Record<string, any>;

export type ReviewInput = {
  content: string;
  rating?: number;
  author?: string | null;
  language?: string | null; // ej. "es", "en"
  platform?: string | null; // ej. "google"
  locationName?: string | null;
  companyName?: string | null;
};

export type ResponseEngineSettings = AnyDict; // usaremos tus settings reales en el paso 2

export async function generateReviewResponse(args: {
  review: ReviewInput;
  settings: ResponseEngineSettings; // UI “reactiva”: lo que tengas en memoria
}): Promise<
  | {
      ok: true;
      content: string;
      meta: {
        model: string;
        temperature: number;
        promptVersion: "engine-v1";
        applied: {
          lang: string;
          targetChars: number;
          tone?: string;
          emojiLevel?: number;
          formality?: "tu" | "usted";
          signature?: string | null;
        };
      };
    }
  | {
      ok: false;
      error: string;
    }
> {
  try {
    const normalized = normalizeSettings(args.settings);
    const { system, user, model, temperature, targetChars, applied } = buildPrompt(
      normalized,
      args.review
    );

    // ⬇️ tu wrapper espera { system, user, ... } y devuelve string
    const raw = await completeOpenAI({
      system,
      user,
      model,
      temperature,
      // Dejamos maxTokens generoso; el recorte real será por caracteres
      maxTokens: 800,
    });

    const clean = sanitize(String(raw ?? "").trim(), {
      ...normalized,
      targetChars,
      lang: applied.lang,
    });

    return {
      ok: true,
      content: clean,
      meta: {
        model,
        temperature,
        promptVersion: "engine-v1",
        applied,
      },
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || "engine_failed" };
  }
}

/* =========================
   1) Normalización settings
   ========================= */
function normalizeSettings(s: AnyDict) {
  // Defaults conservadores; se sobreescriben por UI
  const lang = pickLang(s?.language || s?.lang || "es");
  const length = String(s?.length || s?.targetLength || "medium"); // "very_short" | "short" | "medium" | "long"
  const tone = s?.tone || "neutral"; // "neutral", "positivo", "empático", etc.
  const emojiLevel = clampInt(s?.emojiLevel ?? s?.emojis ?? 0, 0, 3);
  const formality = pickFormality(s?.formality || s?.treatment || "tu"); // "tu" | "usted"
  const signature = s?.standardSignature ?? s?.signature ?? null; // string | null
  const model = s?.model || process.env.AI_MODEL || "gpt-4o-mini";
  const temperature = typeof s?.temperature === "number" ? s.temperature : 0.3;

  // Políticas
  const forbidCompensation = s?.forbidCompensation !== false; // true por defecto
  const stripPII = s?.stripPII !== false; // true por defecto

  return {
    lang,
    length,
    tone,
    emojiLevel,
    formality,
    signature,
    model,
    temperature,
    forbidCompensation,
    stripPII,
    // cualquier otro campo se mantiene
    ...s,
  };
}

/* =========================
   2) Builder de mensajes
   ========================= */
function buildPrompt(settings: AnyDict, review: ReviewInput) {
  const targetChars = mapLengthToChars(settings.length);
  const lang = pickLang(settings.lang || review.language || "es");
  const formality = pickFormality(settings.formality);

  const system = buildSystemInstruction({
    lang,
    tone: settings.tone,
    emojiLevel: settings.emojiLevel,
    formality,
    signature: settings.signature,
    forbidCompensation: settings.forbidCompensation,
  });

  const user = buildUserInstruction({
    lang,
    review,
    targetChars,
    companyName: review.companyName || settings.companyName || "",
    locationName: review.locationName || settings.locationName || "",
  });

  return {
    system,
    user,
    model: settings.model,
    temperature: settings.temperature,
    targetChars,
    applied: {
      lang,
      targetChars,
      tone: String(settings.tone || ""),
      emojiLevel: Number(settings.emojiLevel ?? 0),
      formality,
      signature: settings.signature ?? null,
    },
  };
}

function buildSystemInstruction(opts: {
  lang: string;
  tone: string;
  emojiLevel: number;
  formality: "tu" | "usted";
  signature: string | null;
  forbidCompensation: boolean;
}) {
  const lines: string[] = [];

  lines.push(
    "Eres un asistente que redacta respuestas a reseñas reales de clientes para negocios locales.",
    "No inventes hechos ni ofertas; no pidas datos que ya están en la reseña."
  );

  // tono y estilo
  lines.push(
    `Tono: ${opts.tone || "neutral"}.`,
    `Registro: ${opts.formality === "usted" ? "formal (usted)" : "cercano (tú)"}.`,
    `Idioma objetivo: ${opts.lang}.`
  );

  // emojis
  if (opts.emojiLevel === 0) {
    lines.push("No uses emojis.");
  } else if (opts.emojiLevel === 1) {
    lines.push("Puedes usar como máximo 1 emoji, solo si aporta calidez.");
  } else if (opts.emojiLevel === 2) {
    lines.push("Puedes usar hasta 2 emojis, siempre con moderación.");
  } else if (opts.emojiLevel >= 3) {
    lines.push("Puedes usar hasta 3 emojis con moderación.");
  }

  // firma
  if (opts.signature) {
    lines.push(
      `Firma las respuestas con: "${opts.signature}". Si ya existe firma al final, no la dupliques.`
    );
  } else {
    lines.push("No inventes nombres personales ni cargos si no se proporcionan.");
  }

  // políticas
  if (opts.forbidCompensation) {
    lines.push("No ofrezcas compensaciones económicas, vales o regalos en la respuesta.");
  }

  // formato
  lines.push("Responde en un único párrafo, directo y breve. No incluyas cabeceras ni listas.");

  return lines.join("\n");
}

function buildUserInstruction(args: {
  lang: string;
  review: ReviewInput;
  targetChars: number;
  companyName: string;
  locationName: string;
}) {
  const nameLine = args.companyName
    ? `Negocio: ${args.companyName}${args.locationName ? ` (${args.locationName})` : ""}`
    : "";

  const ratingLine =
    typeof args.review.rating === "number" ? `Valoración: ${args.review.rating}/5` : "";

  const base: string[] = [];
  if (nameLine) base.push(nameLine);
  if (ratingLine) base.push(ratingLine);

  base.push(`Reseña (cliente${args.review.author ? `: ${args.review.author}` : ""}):`, delimit(args.review.content));

  base.push(`Escribe la respuesta en ${args.lang} y no superes ~${args.targetChars} caracteres.`);

  return base.filter(Boolean).join("\n");
}

function delimit(text: string) {
  const clean = (text || "").toString().trim();
  return `"""${clean}"""`;
}

/* =========================
   3) Post-filtros / sanitizado
   ========================= */
function sanitize(content: string, settings: AnyDict) {
  let out = (content || "").toString().trim();

  // Recortar por caracteres (duro)
  const limit = Number(settings.targetChars || 0);
  if (limit > 0 && out.length > limit) {
    out = out.slice(0, limit).trim();
    // remate sencillo si cortamos a mitad
    out = out.replace(/[,:;·\-–—]$/, "").trim();
  }

  // PII básica: emails y teléfonos
  if (settings.stripPII) {
    out = out
      // emails
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[correo]")
      // teléfonos simples (muy conservador)
      .replace(/\+?\d[\d\s().-]{7,}\d/g, "[teléfono]");
  }

  // Compensaciones directas (ES muy básico, afinaremos si hace falta)
  if (settings.forbidCompensation) {
    const comp = /\b(reembolso|reembolsar|compensación|descuento|vale|bono|cupón|invitar|gratis)\b/i;
    if (comp.test(out)) {
      // Suavizamos sin ofrecer nada
      out = out.replace(comp, "solución").trim();
    }
  }

  // Firma (evitar duplicados simples)
  const signature = settings.signature;
  if (signature && !endsWithSignature(out, signature)) {
    // Añadimos con separación prudente
    out = ensureFinalDot(out) + " " + signature.trim();
  }

  return out;
}

function endsWithSignature(text: string, signature: string) {
  const t = text.trim();
  const s = signature.trim();
  if (!t || !s) return false;
  const tail = t.slice(-s.length).toLowerCase();
  return tail === s.toLowerCase();
}

function ensureFinalDot(text: string) {
  const t = text.trim();
  if (!t) return t;
  if (/[.!?…]$/.test(t)) return t;
  return t + ".";
}

/* =========================
   Helpers
   ========================= */
function pickLang(x: any): "es" | "en" | "pt" {
  const v = String(x || "").toLowerCase();
  if (v === "en") return "en";
  if (v === "pt") return "pt";
  return "es";
}

function pickFormality(x: any): "tu" | "usted" {
  const v = String(x || "").toLowerCase();
  if (v === "usted") return "usted";
  return "tu";
}

function mapLengthToChars(length: any): number {
  const v = String(length || "").toLowerCase();
  if (v === "very_short" || v === "muy_breve") return 180;
  if (v === "short" || v === "breve") return 300;
  if (v === "long" || v === "largo") return 800;
  return 450; // medium
}

function clampInt(n: any, min: number, max: number) {
  const v = Number.isFinite(Number(n)) ? Number(n) : min;
  if (v < min) return min;
  if (v > max) return max;
  return Math.round(v);
}

/* =========================
   4) PREVIEW EXPORT — para la UI de settings
   ========================= */
/**
 * Devuelve el prompt que se usaría (system + user) con los settings actuales.
 * Útil para mostrar un preview en la página de Configuración sin tener que “Guardar”.
 */
export function getPromptPreview(args: {
  settings: ResponseEngineSettings;
  review: ReviewInput;
}) {
  const normalized = normalizeSettings(args.settings);
  const { system, user, model, temperature, targetChars, applied } = buildPrompt(
    normalized,
    args.review
  );
  return { system, user, model, temperature, targetChars, applied };
}
