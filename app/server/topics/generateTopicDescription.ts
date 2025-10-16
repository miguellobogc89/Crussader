// app/server/topics/generateTopicDescription.ts
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { composeTopicDescription } from "@/app/server/topics/buildTopicDescriptionPrompt";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callLLM(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
  });
  return response.choices[0].message.content ?? "";
}

/**
 * Genera y guarda una descripción para un topic existente (neutra, sin recomendaciones).
 * Versión "esquema-agnóstica": NO usa `select` ni asume nombres de columnas.
 * - Lee el topic por id.
 * - Busca los concepts por topic_id (si tu FK se llama distinto, cambia esa condición).
 * - Normaliza a los campos mínimos que necesita el prompt.
 */
export async function generateAndStoreTopicDescription(topicId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
  });

  if (!topic) {
    throw new Error(`Topic ${topicId} no encontrado.`);
  }

  // Buscar los concepts asociados al topic
  const rawConcepts = await prisma.concept.findMany({
    where: { topic_id: topicId as any },
  });

  const concepts = rawConcepts.map((c: any) => {
    const name: string =
      (typeof c.label === "string" && c.label) ||
      (typeof c.name === "string" && c.name) ||
      "";

    const previews: unknown =
      c.preview_concepts ??
      c.previewSnippets ??
      c.preview_snippets ??
      c.snippets ??
      c.examples ??
      c.sample_texts ??
      [];

    const previewSnippets =
      Array.isArray(previews)
        ? previews.filter((s) => typeof s === "string").slice(0, 3)
        : undefined;

    return {
      id: String(c.id),
      name,
      previewSnippets,
    };
  });

  const topicName: string =
    (topic as any).label ??
    (topic as any).name ??
    "Topic";

  const totalReviewsInTopic: number | undefined =
    typeof (topic as any).review_count === "number"
      ? (topic as any).review_count
      : undefined;

  const input = {
    topicName,
    concepts,
    totalReviewsInTopic,
    locationName: undefined as string | undefined,
    companyName: undefined as string | undefined,
  };

  const description = await composeTopicDescription(input, callLLM);

  await prisma.topic.update({
    where: { id: topicId },
    data: { description },
  });

  return description;
}
