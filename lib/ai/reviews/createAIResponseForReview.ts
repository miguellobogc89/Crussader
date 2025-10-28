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
 * Elimina firmas al final y añade exactamente "\n\n" + firmaLiteral
 */
function enforceSingleSignature(text: string, signatureRaw?: string): string {
  const signature = (signatureRaw ?? "").toString().trim();
  let t = (text ?? "").toString().trimEnd();

  // 1) Quitar firmas del final (varios patrones comunes) — iterativo por si hay duplicadas
  //    - exacta: la firma literal del usuario
  //    - genéricas: líneas que empiezan por —/-/– y palabras tipo Equipo/Saludos/Atentamente
  const patterns: RegExp[] = [];

  if (signature) {
    patterns.push(new RegExp(`(\\n|\\r|\\s)*${escRegex(signature)}(\\.|\\s|\\u00A0)*$`, "i"));
  }

  // Patrones genéricos (firma al final de una o más líneas)
  patterns.push(
    /(\n|\r|\s)*(—|-|–)\s*[^\n\r]*$/i,                              // línea final con raya + texto
    /(\n|\r|\s)*(Atentamente|Saludos|Equipo)[^\n\r]*$/i              // despedidas típicas
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

  // 2) Añadir exactamente 2 saltos de línea + firma literal (si hay)
  if (signature.length > 0) {
    t = `${t}\n\n${signature}`;
  }

  return t;
}

/**
 * Recorta respetando el límite, preservando la firma completa si existe.
 * - Si hay firma, recorta solo el cuerpo.
 * - Si no hay firma, recorta el texto completo.
 */
function clampWithSignature(fullText: string, signatureRaw?: string, maxChars?: number | null) {
  if (!maxChars || maxChars <= 0) return fullText;

  const signature = (signatureRaw ?? "").toString().trim();
  if (signature.length === 0) {
    // Sin firma: recorte estándar
    if (fullText.length <= maxChars) return fullText;
    return fullText.slice(0, maxChars).trimEnd();
  }

  // Con firma: separar cuerpo y firma por el final exacto "\n\n" + firma
  const tail = `\n\n${signature}`;
  if (!fullText.endsWith(tail)) {
    // Por seguridad, si no coincide, intentar forzar formato y luego seguir
    const enforced = enforceSingleSignature(fullText, signature);
    if (!enforced.endsWith(tail)) {
      return enforced.length <= maxChars ? enforced : enforced.slice(0, maxChars).trimEnd();
    }
    // Reemplazamos para continuar el flujo normal
    fullText = enforced;
  }

  const body = fullText.slice(0, fullText.length - tail.length);
  const maxBody = maxChars - tail.length;

  if (maxBody <= 0) {
    // Si no cabe nada del cuerpo, dejamos solo firma (último recurso)
    return tail.trimStart();
  }

  const clippedBody = body.length <= maxBody ? body : body.slice(0, maxBody).trimEnd();
  return `${clippedBody}${tail}`;
}

/**
 * Genera, post-filtra y persiste. Devuelve la fila Response creada.
 */
export async function createAIResponseForReview(reviewId: string) {
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

  if (!review) throw new Error("Review not found");

  // 1) Cargar settings y validar
  const rs = await prisma.responseSettings.findUnique({
    where: { companyId: review.companyId },
    select: { config: true },
  });

  const parsed = rs?.config ? ResponseSettingsSchema.safeParse(rs.config) : null;
  const cfg: ResponseSettings = (parsed?.success
    ? parsed.data
    : ({ ...DEFAULT_SETTINGS } as ResponseSettings));

  // 2) Mensajes (system + user)
  const {
    system,
    user,
    targetLang,
    model,
    temperature,
    maxChars,
  } = buildMessagesFromSettings(cfg, {
    rating: review.rating,
    comment: review.comment ?? null,
    languageCode: review.languageCode ?? null,
    reviewerName: review.reviewerName ?? null,
  });

  // 3) LLM
  const raw = await completeOpenAI({
    system,
    user,
    model: model ?? process.env.AI_MODEL ?? "gpt-4o-mini",
    temperature: Math.min(Math.max(temperature ?? 0.6, 0), 0.8),
    maxTokens: 256,
  });

  let content = (raw ?? "").trim() || "(sin contenido)";

  // 4) Post-filtros (¡sin firma aquí!)
  const customerFirst =
    (review.reviewerName ?? "").trim().split(/\s+/)[0] || null;

  content = sanitizeAndConstrain(content, cfg, {
    maxChars,              // se volverá a aplicar tras firma, con preservación
    lang: targetLang,
    signature: null,       // <- nunca insertar firma aquí
    customerName: customerFirst,
  });

  // 4.1) Firma: quitar duplicados y añadir EXACTAMENTE "\n\n" + firmaLiteral
  const signature = (cfg.standardSignature ?? "").toString().trim();
  content = enforceSingleSignature(content, signature);

  // 4.2) Recorte final preservando la firma completa
  content = clampWithSignature(content, signature, maxChars ?? cfg.maxCharacters ?? null);

  // 5) Persistir
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
      model: model ?? "gpt-4o-mini",
      temperature: typeof temperature === "number" ? temperature : 0.6,
      language: targetLang,
      tone: String(cfg.tone),
      businessType: cfg.sector,
      promptVersion: "settings-v1",
    },
  });

  return saved;
}
