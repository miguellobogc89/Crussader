// lib/ai/createAIResponseForReview.ts
import { prisma } from "@/lib/prisma";
import { buildMessagesFromSettings } from "@/lib/ai/prompt/promptBuilder";
import { sanitizeAndConstrain } from "@/lib/ai/policy/postFilters";
import type { ResponseSettings } from "@/app/schemas/response-settings";
import { ResponseSettingsSchema } from "@/app/schemas/response-settings";
import { completeOpenAI } from "@/lib/ai/providers/openai";

// fallback por si no hay settings en DB aún
const DEFAULT_SETTINGS: ResponseSettings = {
  businessName: "Tu Negocio",
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
  ctaText: "¡Gracias por tu visita!",
  showCTAWhen: "below3",
  addUTM: false,
  bannedPhrases: [],
  noPublicCompensation: true,
  avoidPersonalData: true,
  publishMode: "draft",
  autoPublishThreshold: "4stars",
  variantsToGenerate: 1,
  selectionMode: "auto",
  model: "gpt-4o",
  creativity: 0.6,
  maxCharacters: 300,
};

// API principal que estabas usando desde el route
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

  // 1) Cargar settings de empresa
  const rs = await prisma.responseSettings.findUnique({
    where: { companyId: review.companyId },
    select: { config: true },
  });

  const cfg = ResponseSettingsSchema.safeParse(rs?.config).success
    ? (rs!.config as ResponseSettings)
    : DEFAULT_SETTINGS;

  // 2) Construir mensajes (system + user) según ajustes y rating
  const { system, user, targetLang, model, temperature, maxChars } =
    buildMessagesFromSettings(cfg, review);

  // 3) Llamada al modelo usando el wrapper (devuelve texto directo)
  const raw = await completeOpenAI({
    system,
    user,
    model: model ?? process.env.AI_MODEL ?? "gpt-4o-mini",
    temperature: Math.min(Math.max(temperature ?? 0.6, 0), 0.8),
    maxTokens: 256,
  });

  let content = (raw ?? "").trim() || "(sin contenido)";

  // 4) Post-filtros / guardarraíles y longitud
  const customerFirst =
    (review.reviewerName ?? "").trim().split(/\s+/)[0] || null;

  content = sanitizeAndConstrain(content, cfg, {
    maxChars,
    lang: targetLang,
    signature: cfg.standardSignature ?? null,
    customerName: customerFirst,
  });
  // 5) Persistir en tu tabla Response (tal y como ya hacías)
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
    },
  });

  return saved;
}
