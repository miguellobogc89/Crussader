// lib/ai/engine.ts
import { completeOpenAI } from "./providers/openai";
import { applyPostFilters } from "./policy/postFilters";
import type { AIOptions, TemplateInput } from "./types";

/**
 * Compat: generamos el "prompt" del usuario sin depender de buildPrompt.
 * Usa lo que haya en TemplateInput (o input.review.*).
 */
function buildLegacyPrompt(templateId: string, input: TemplateInput): string {
  const anyInput = input as any;
  const rating: number = anyInput.rating ?? anyInput.review?.rating ?? 5;
  const comment: string = (anyInput.comment ?? anyInput.review?.comment ?? "").toString().trim();
  const reviewer: string =
    (anyInput.reviewerName ?? anyInput.review?.reviewerName ?? "cliente").toString().trim() || "cliente";

  const header = `Reseña (${rating}★) de ${reviewer}:`;
  const body = comment ? `"${comment}"` : "(Sin comentario).";

  switch (templateId) {
    case "breve-v1":
      return `${header}\n${body}\nEscribe una respuesta MUY breve (1-2 frases).`;
    case "disculpas-v1":
      return `${header}\n${body}\nEl foco es pedir disculpas y ofrecer ayuda amable. Sé empático.`;
    default: // "default-v1" u otros
      return `${header}\n${body}\nRedacta una respuesta adecuada, cordial y profesional.`;
  }
}

export async function generateReviewReply(input: TemplateInput, opts: AIOptions = {}) {
  const system = "Eres un assistant especializado en respuestas públicas a reseñas.";
  const prompt = buildLegacyPrompt(opts.templateId ?? "default-v1", input);

  const content = await completeOpenAI({
    system,
    user: prompt,
    temperature: opts.temperature ?? 0.6,
    maxTokens: opts.maxTokens ?? 300,
    // si tu AIOptions tiene modelo, lo pasamos
    model: (opts as any)?.model,
  });

  // Compat: applyPostFilters puede llamarse sin cfg/opts (ver overload abajo)
  return applyPostFilters(content);
}
