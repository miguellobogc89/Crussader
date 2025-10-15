// app/server/topics/labeling.ts
// ===================================================
// Genera un label/description de topic a partir de
// los labels de conceptos miembros + sentimiento.
// ===================================================

import { openai } from "@/app/server/openaiClient";

const MODEL = "gpt-4o-mini";

export async function labelTopic(
  conceptLabels: string[],
  sentiment: "positive" | "negative" | "neutral"
): Promise<{ label: string; description?: string }> {
  const sys = [
    "Eres un asistente que asigna un NOMBRE de TOPIC breve y útil para negocio.",
    "Usa vocabulario claro, NO técnico.",
    "Longitud recomendada: 2–5 palabras.",
    "Incluye el matiz de sentimiento si ayuda, sin forzar.",
  ].join(" ");

  const user = [
    "Dado este conjunto de conceptos, genera:",
    "- Un label breve (2–5 palabras).",
    "- Una breve descripción (1 frase).",
    "",
    `Sentimiento predominante: ${sentiment}`,
    "Conceptos:",
    ...conceptLabels.map((l, i) => `- ${i + 1}. ${l}`),
    "",
    "Devuelve SOLO JSON con {label, description}."
  ].join("\n");

  try {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 120,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });
    const raw = resp.choices?.[0]?.message?.content?.trim() ?? "{}";
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const label = String(parsed?.label || "").trim() || "Topic";
    const description = parsed?.description ? String(parsed.description).trim() : undefined;
    return { label, description };
  } catch {
    // Fallback simple
    const hint = sentiment === "positive" ? "positivas" : sentiment === "negative" ? "negativas" : "neutras";
    return { label: `Tema (${hint})`, description: "Agrupación automática de conceptos afines." };
  }
}
