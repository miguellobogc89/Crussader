// lib/ai/createAIResponseForReview.adapter.ts
// Adaptador compatible con la API actual, delega la generación al motor unificado.
// Objetivo: NO tocar la ruta API por dentro; solo cambiar un import.
// Mantiene promptVersion "settings-v1" para no romper analítica/reportes.

import { generateReviewResponse as runEngine } from "@/lib/ai/reviews/responseEngine";

type AnyDict = Record<string, any>;

/**
 * Firma flexible para no romper llamadas existentes.
 * Acepta:
 *  - { review, settings? }
 *  - { rating, comment, reviewerName, ... , settings? }
 *  - { ...cualquier DTO de la ruta } con campos equivalentes
 */
export async function createAIResponseForReview(input: AnyDict): Promise<AnyDict> {
  // 1) Resolver la reseña desde diferentes formatos de entrada
  const src: AnyDict = input?.review ?? input ?? {};

  const review = {
    content: (src.comment ?? src.content ?? "").toString(),
    rating: numOrUndef(src.rating ?? src.stars),
    author: strOrNull(src.reviewerName ?? src.author),
    language: (src.language ?? src.lang ?? "es") as string,
    platform: strOrNull(src.platform ?? "google"),
    locationName: strOrNull(src.locationName ?? src.location?.name),
    companyName: strOrNull(src.companyName ?? src.company?.name),
  };

  // 2) Settings reactivos (desde UI, memoria o defaults)
  const settings: AnyDict =
    input?.settings ??
    input?.responseSettings ??
    {
      lang: review.language ?? "es",
      language: review.language ?? "es",
      tone: src.tone ?? "neutral",
      emojiLevel: src.emojiLevel ?? src.emojis ?? 0,
      formality: src.formality ?? src.treatment ?? "tu",
      signature: src.signature ?? src.standardSignature ?? null,
      temperature: typeof src.temperature === "number" ? src.temperature : 0.3,
      model: src.model || process.env.AI_MODEL || "gpt-4o-mini",
      forbidCompensation: src.forbidCompensation !== false,
      stripPII: src.stripPII !== false,
      // longitud objetivo (si la UI lo manda con otras claves)
      length: src.length ?? src.targetLength ?? "medium", // very_short | short | medium | long
      companyName: src.companyName ?? src.company?.name ?? null,
      locationName: src.locationName ?? src.location?.name ?? null,
    };

  // 3) Llamada al motor unificado
  const res = await runEngine({ review, settings });

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || "engine_failed",
    };
  }

  // 4) Moldear salida compatible con la API actual
  return {
    ok: true,
    content: res.content,
    // mantener promptVersion legacy para continuidad de métricas
    promptVersion: "settings-v1",
    meta: {
      model: res.meta.model,
      temperature: res.meta.temperature,
      applied: res.meta.applied,
      // puedes añadir aquí un settingsHash si luego lo usamos para auditoría
    },
  };
}

/* ===== helpers suaves ===== */
function strOrNull(x: any): string | null {
  const s = (x ?? "").toString().trim();
  return s ? s : null;
}
function numOrUndef(x: any): number | undefined {
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}
