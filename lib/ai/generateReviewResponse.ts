// lib/ai/generateReviewResponse.ts
// Adaptador legacy → motor unificado.
// Mantiene la firma para no romper el playground o el “prompt de prueba”.

import { generateReviewResponse as runEngine } from "@/lib/ai/responseEngine";
import type { Tone, Language, TemplateId } from "./types";

export type GenerateReviewResponseInput = {
  rating: number;
  comment?: string | null;
  reviewerName?: string | null;
  businessName?: string | null;
  locationName?: string | null;
};

export type GenerateReviewResponseOptions = {
  tone?: Tone;
  lang?: Language;
  templateId?: TemplateId; // ignorado aquí (ya no usamos plantillas legacy)
};

export async function generateReviewResponse(
  input: GenerateReviewResponseInput,
  options: GenerateReviewResponseOptions = {}
): Promise<string> {
  // Mapeo al input del motor unificado
  const review = {
    content: (input.comment ?? "").toString(),
    rating: input.rating,
    author: input.reviewerName ?? null,
    companyName: input.businessName ?? null,
    locationName: input.locationName ?? null,
    language: options.lang ?? "es",
  };

  // Settings mínimos en caliente (reactivos desde UI)
  const settings = {
    lang: options.lang ?? "es",
    language: options.lang ?? "es",
    tone: options.tone ?? "neutral",
    // Puedes añadir más campos si el playground los pasa:
    // emojiLevel, formality, signature, temperature, model, etc.
  };

  const res = await runEngine({ review, settings });
  if (!res.ok) throw new Error(res.error || "engine_failed");
  return res.content;
}
