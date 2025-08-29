import { buildPrompt } from "./prompt/promptBuilder";
import { completeOpenAI } from "./providers/openai";
import { applyPostFilters } from "./policy/postFilters";
import type { AIOptions, TemplateInput } from "./types";

export async function generateReviewReply(input: TemplateInput, opts: AIOptions = {}) {
  const system = "Eres un assistant especializado en respuestas públicas a reseñas.";
  const prompt = buildPrompt(opts.templateId ?? "default-v1", input);

  const content = await completeOpenAI({
    system,
    user: prompt,
    temperature: 0.6,
    maxTokens: opts.maxTokens ?? 300,
  });

  return applyPostFilters(content);
}
