// app/server/topics/generateTopicDescription.ts
import { prisma } from "@/app/server/db";
import { openai } from "@/app/server/openaiClient";

// Tipos de mensajes compatibles con openai.chat.completions
type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

async function callLLM(messages: ChatMsg[]): Promise<string> {
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 220,
    messages,
  });
  return resp.choices?.[0]?.message?.content?.trim() ?? "";
}

/** Resumen fallback basado en 2–3 labels, por si el LLM devuelve vacío */
function fallbackFromLabels(labels: string[]): string {
  const uniq = Array.from(new Set(labels.map((s) => s.replace(/\.+$/, "").trim()))).slice(0, 3);
  if (!uniq.length) return "Agrupación automática de conceptos afines.";
  const joined = uniq.join("; ");
  return joined.length > 220 ? joined.slice(0, 220).replace(/\s+\S*$/, "") + "…" : joined;
}

/**
 * Genera y guarda una descripción cualitativa (1–2 frases) para un topic:
 * - Usa labels de los concepts + 1 snippet corto del texto de la review asociada (si hay).
 * - Debe ser un resumen sintético y accionable (sin listas ni viñetas).
 */
export async function generateAndStoreTopicDescription(topicId: string) {
  // 1) Topic + concepts + review.comment
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, label: true },
  });
  if (!topic) throw new Error(`Topic ${topicId} no encontrado.`);

  const concepts = await prisma.concept.findMany({
    where: { topic_id: topicId },
    select: {
      id: true,
      label: true,
      review: { select: { comment: true } },
    },
    orderBy: { updated_at: "desc" },
    take: 80, // suficiente contexto
  });

  // Si topic vacío, dejar algo mínimo
  if (concepts.length === 0) {
    const minimal = `${topic.label}: 0 conceptos relacionados`;
    await prisma.topic.update({ where: { id: topicId }, data: { description: minimal } });
    return minimal;
  }

  // 2) Construcción del prompt (orientado a resumen cualitativo)
  const snippets: { concept: string; snippet?: string }[] = concepts.map((c) => {
    const raw = (c.review?.comment ?? "").trim();
    const short = raw
      ? (raw.length > 180 ? raw.slice(0, 180).replace(/\s+\S*$/, "") + "…" : raw)
      : undefined;
    return { concept: c.label, snippet: short };
  });

  const sys = [
    "Eres un analista que escribe un RESUMEN breve y cualitativo (1–2 frases) basado en evidencias.",
    "Estilo: claro, accionable y específico; evita listas, etiquetas genéricas y palabras vacías.",
    "Debe quedar claro si el tono global es positivo, negativo o mixto, pero sin forzarlo.",
    "No repitas literalmente todos los conceptos; sintetiza el patrón común en lenguaje natural.",
  ].join("\n");

  const user = [
    `Topic: ${topic.label}`,
    "Base de conceptos (con ejemplos reales cuando existan):",
    JSON.stringify(snippets, null, 2),
    "",
    "Escribe **solo** 1–2 frases, sin viñetas, sin enumeraciones, sin comillas.",
  ].join("\n");

  // 3) LLM + fallback
  let description = "";
  try {
    description = await callLLM([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);
    description = (description || "").trim();
  } catch {
    description = "";
  }

  if (!description) {
    // Fallback con 2–3 labels
    const labels = concepts.map((c) => c.label);
    description = fallbackFromLabels(labels);
  }

  // 4) Persistir
  await prisma.topic.update({
    where: { id: topicId },
    data: { description },
  });

  return description;
}

/** Utilidad opcional: generar en lote para varios topics */
export async function generateDescriptionsForTopics(topicIds: string[]) {
  const results: Record<string, string> = {};
  for (const id of topicIds) {
    try {
      results[id] = await generateAndStoreTopicDescription(id);
    } catch {
      results[id] = "";
    }
  }
  return results;
}
