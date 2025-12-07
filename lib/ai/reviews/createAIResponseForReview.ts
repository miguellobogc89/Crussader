// lib/ai/reviews/createAIResponseForReview.ts
import { prisma } from "@/lib/prisma";
import { buildMessagesFromSettings } from "@/lib/ai/reviews/prompt/promptBuilder";
import { sanitizeAndConstrain } from "@/lib/ai/policy/postFilters";
import type { ResponseSettings } from "@/app/schemas/response-settings";
import { ResponseSettingsSchema } from "@/app/schemas/response-settings";
import { completeOpenAI } from "@/lib/ai/providers/openai";

/**
 * DEFAULT_SETTINGS:
 * Solo claves presentes en el schema actual.
 */
const DEFAULT_SETTINGS: Partial<ResponseSettings> = {
  sector: "General",
  treatment: "tu",
  tone: 3,
  emojiIntensity: 1,
  standardSignature: "— Equipo",
  language: "es",
  autoDetectLanguage: true,
  starSettings: {
    "1-2": { objective: "apology", length: 1, enableCTA: true },
    "3":   { objective: "neutral", length: 1, enableCTA: false },
    "4-5": { objective: "thanks",  length: 1, enableCTA: true },
  },
  preferredChannel: "web",
  addUTM: false,
  bannedPhrases: [],
  noPublicCompensation: true,
  avoidPersonalData: true,
  publishMode: "draft",
  autoPublishThreshold: "4stars",
  variantsToGenerate: 1,
  selectionMode: "auto",
  model: "gpt-4o-mini",
  creativity: 0.6,
  maxCharacters: 300,
  notificationContact: "",
};

function escRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Merge seguro: DEFAULT_SETTINGS + rawConfig → ResponseSettings válido
 */
function mergeSettingsWithDefault(rawConfig: unknown): ResponseSettings {
  const base = {
    ...DEFAULT_SETTINGS,
    ...(rawConfig || {}),
  };
  // Si falla el parse, tiramos solo de DEFAULT_SETTINGS para no romper
  const parsed = ResponseSettingsSchema.safeParse(base);
  if (parsed.success) return parsed.data;

  const fallback = ResponseSettingsSchema.safeParse(DEFAULT_SETTINGS);
  if (fallback.success) return fallback.data;

  // Último recurso: lanza error (no debería pasar)
  return ResponseSettingsSchema.parse(DEFAULT_SETTINGS);
}

/**
 * Elimina firmas al final y añade exactamente "\n\n" + firmaLiteral
 */
function enforceSingleSignature(text: string, signatureRaw?: string): string {
  const signature = (signatureRaw ?? "").toString().trim();
  let t = (text ?? "").toString().trimEnd();

  const patterns: RegExp[] = [];

  if (signature) {
    patterns.push(
      new RegExp(
        `(\\n|\\r|\\s)*${escRegex(signature)}(\\.|\\s|\\u00A0)*$`,
        "i"
      )
    );
  }

  patterns.push(
    /(\n|\r|\s)*(—|-|–)\s*[^\n\r]*$/i,
    /(\n|\r|\s)*(Atentamente|Saludos|Equipo)[^\n\r]*$/i
  );

  let safety = 0;
  let changed = true;
  while (changed && safety < 8) {
    changed = false;
    for (const rx of patterns) {
      if (rx.test(t)) {
        t = t.replace(rx, "").trimEnd();
        changed = true;
      }
    }
    safety++;
  }

  if (signature.length > 0) {
    t = `${t}\n\n${signature}`;
  }

  return t;
}

/**
 * Recorta respetando el límite, preservando la firma completa si existe.
 */
function clampWithSignature(
  fullText: string,
  signatureRaw?: string,
  maxChars?: number | null
) {
  if (!maxChars || maxChars <= 0) return fullText;

  const signature = (signatureRaw ?? "").toString().trim();
  if (signature.length === 0) {
    if (fullText.length <= maxChars) return fullText;
    return fullText.slice(0, maxChars).trimEnd();
  }

  const tail = `\n\n${signature}`;
  if (!fullText.endsWith(tail)) {
    const enforced = enforceSingleSignature(fullText, signature);
    if (!enforced.endsWith(tail)) {
      return enforced.length <= maxChars
        ? enforced
        : enforced.slice(0, maxChars).trimEnd();
    }
    fullText = enforced;
  }

  const body = fullText.slice(0, fullText.length - tail.length);
  const maxBody = maxChars - tail.length;

  if (maxBody <= 0) {
    return tail.trimStart();
  }

  const clippedBody =
    body.length <= maxBody ? body : body.slice(0, maxBody).trimEnd();
  return `${clippedBody}${tail}`;
}

/**
 * Core compartido: genera texto usando cfg + datos de review (SIN persistir).
 * Ahora admite modo "regenerate" + previousContent para obligar variante.
 */
async function generateContentWithConfig(input: {
  cfg: ResponseSettings;
  rating: number;
  comment: string | null;
  languageCode: string | null;
  reviewerName: string | null;
  mode?: string;
  previousContent?: string | null;
}) {
  const {
    cfg,
    rating,
    comment,
    languageCode,
    reviewerName,
    mode,
    previousContent,
  } = input;

  let {
    system,
    user,
    targetLang,
    model,
    temperature,
    maxChars,
  } = buildMessagesFromSettings(cfg, {
    rating,
    comment,
    languageCode,
    reviewerName,
  });

  // 🧠 Si es regeneración y tenemos texto previo, añadimos instrucción explícita
  if (
    mode === "regenerate" &&
    previousContent &&
    previousContent.trim().length > 0
  ) {
    user +=
      "\n\nIMPORTANTE: Esta fue una respuesta anterior que ya se usó o se propuso y NO debe repetirse ni casi copiarse:\n\n" +
      `"""${previousContent}"""\n\n` +
      "Genera ahora una nueva respuesta DIFERENTE en contenido y redacción, manteniendo el mismo tono, políticas y límites de longitud.";
  }

  const resolvedModel = model ?? process.env.AI_MODEL ?? "gpt-4o-mini";

  let baseTemp = temperature ?? 0.6;
  // Un pelín más creativa en regeneraciones para evitar clones
  if (mode === "regenerate") {
    baseTemp += 0.15;
  }
  const resolvedTemp = Math.min(Math.max(baseTemp, 0), 0.9);

  const raw = await completeOpenAI({
    system,
    user,
    model: resolvedModel,
    temperature: resolvedTemp,
    maxTokens: 256,
  });

  let content = (raw ?? "").trim() || "(sin contenido)";

  const customerFirst =
    (reviewerName ?? "").trim().split(/\s+/)[0] || null;

  content = sanitizeAndConstrain(content, cfg, {
    maxChars,
    lang: targetLang,
    signature: null,
    customerName: customerFirst,
  });

  // --- FIRMA OPCIONAL ---
  const signature = (cfg.standardSignature ?? "").toString().trim();

  // Si NO hay firma → limpiamos posibles firmas generadas por IA y devolvemos
  if (signature.length === 0) {
    content = enforceSingleSignature(content, "");
    content = clampWithSignature(
      content,
      "",
      maxChars ?? cfg.maxCharacters ?? null
    );
    return {
      content,
      targetLang,
      model: resolvedModel,
      temperature: resolvedTemp,
      maxChars: maxChars ?? cfg.maxCharacters ?? null,
    };
  }

  // Si sí hay firma → aplicar lógica normal de firma única
  content = enforceSingleSignature(content, signature);
  content = clampWithSignature(
    content,
    signature,
    maxChars ?? cfg.maxCharacters ?? null
  );

  return {
    content,
    targetLang,
    model: resolvedModel,
    temperature: resolvedTemp,
    maxChars: maxChars ?? cfg.maxCharacters ?? null,
  };
}

/** Input extendido para soportar regeneración */
type CreateCoreInput =
  | string
  | {
      reviewId: string;
      mode?: string;
      previousContent?: string;
      previousResponseId?: string;
    };

/**
 * Genera, post-filtra y persiste. Devuelve la fila Response creada.
 * (flujo REAL para reseñas de verdad)
 */
export async function createAIResponseForReview(input: CreateCoreInput) {
  const reviewId = typeof input === "string" ? input : input.reviewId;
  const mode =
    typeof input === "string" ? "generate" : input.mode ?? "generate";
  const previousContent =
    typeof input === "string" ? undefined : input.previousContent ?? undefined;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      rating: true,
      comment: true,
      languageCode: true,
      companyId: true,
      reviewerName: true,
      createdAtG: true,
    },
  });

  // 🔧 Alineamos con el route (catch que mira "review_not_found")
  if (!review) throw new Error("review_not_found");

  // 🆕 CORTE DE 30 DÍAS (SUAVIZADO):
  // - Si la reseña es muy antigua y YA hay respuesta → usamos la existente,
  //   SOLO cuando no estamos en modo regenerar.
  if (review.createdAtG instanceof Date) {
    const now = new Date();
    const diffMs = now.getTime() - review.createdAtG.getTime();
    const days = diffMs / (1000 * 60 * 60 * 24);

    if (days > 30 && mode !== "regenerate") {
      const existing = await prisma.response.findFirst({
        where: { reviewId: review.id },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        // Review vieja + ya respondida → devolvemos la existente
        return existing;
      }
      // Si no hay existing, seguimos abajo y GENERAMOS igualmente.
    }
  }

  const rs = await prisma.responseSettings.findUnique({
    where: { companyId: review.companyId },
    select: { config: true },
  });

  const cfg = mergeSettingsWithDefault(rs?.config ?? {});

  const {
    content,
    targetLang,
    model,
    temperature,
  } = await generateContentWithConfig({
    cfg,
    rating: review.rating,
    comment: review.comment ?? null,
    languageCode: review.languageCode ?? null,
    reviewerName: review.reviewerName ?? null,
    mode,
    previousContent: previousContent ?? null,
  });

  const saved = await prisma.response.create({
    data: {
      reviewId: review.id,
      content,
      status: "PENDING",
      active: true,
      published: false,
      edited: false,
      generationCount: 1,
      lastGeneratedAt: new Date(),
      source: "AI",
      model,
      temperature,
      language: targetLang,
      tone: String(cfg.tone),
      businessType: cfg.sector,
      promptVersion: "settings-v1",
      auto_publish_status: "pending",
    },
  });

  return saved;
}


/**
 * NUEVO: modo PREVIEW
 * Usa settings enviados desde el panel (sin mirar BBDD) y NO persiste nada.
 */
export async function createAIResponsePreviewFromSettings(input: {
  settings: ResponseSettings;
  rating: number;
  comment: string;
  languageCode?: string | null;
  reviewerName?: string | null;
}) {
  const cfg = mergeSettingsWithDefault(input.settings);

  const result = await generateContentWithConfig({
    cfg,
    rating: input.rating,
    comment: input.comment ?? null,
    languageCode: input.languageCode ?? null,
    reviewerName: input.reviewerName ?? null,
  });

  return result; // { content, targetLang, model, temperature, maxChars }
}
