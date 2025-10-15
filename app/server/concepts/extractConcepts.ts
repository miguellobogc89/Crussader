// app/server/concepts/extractConcepts.ts
// ==============================================
// Extrae conceptos atómicos con SENTIMIENTO y con
// un **mínimo de 4 palabras** (ideal 5–10) y lenguaje
// informativo para negocio (evita adjetivos sueltos).
// Devuelve [{ label, sentiment, confidence }] (0..6).
// ==============================================

import { openai } from "../openaiClient";

const MODEL = "gpt-4o-mini";

export type ExtractedConcept = {
  label: string; // p.ej. "Cliente muy satisfecho con el trato recibido"
  sentiment: "positive" | "negative" | "neutral";
  confidence?: number; // 0..1
};

export async function extractConceptsFromReview(text: string): Promise<ExtractedConcept[]> {
  const sys = [
    "Eres un extractor de CONCEPTOS para negocio.",
    "Cada concepto debe ser atómico, específico y expresado en lenguaje informativo.",
    "EVITA palabras sueltas o adjetivos vagos (p.ej. 'Genial', 'Excelente').",
    "Usa frases de **mínimo 4 palabras** (ideal 5–10) que indiquen claramente la idea.",
    "Incluye SENTIMIENTO en {positive, negative, neutral}.",
    "Responde SOLO JSON: array de objetos {label, sentiment, confidence}.",
    "No repitas sinónimos del mismo concepto; máximo 6 ítems.",
  ].join(" ");

  const user = [
    "INSTRUCCIONES:",
    "- Lee la reseña y extrae 0–6 *ideas básicas* útiles para negocio.",
    "- Cada 'label' debe:",
    "  • Tener **mínimo 4 palabras** (ideal 5–10).",
    "  • Ser **clara y concreta**, NO adjetivo suelto.",
    "  • Preferir formatos como:",
    "    - 'Cliente muy satisfecho con el trato recibido'",
    "    - 'Cliente valora resultados obtenidos en 24 horas'",
    "    - 'Dificultad para anular cita por teléfono'",
    "    - 'Espera de veinte minutos antes de ser atendido'",
    "  • Evitar duplicados y vaguedades.",
    "- 'sentiment' ∈ {positive,negative,neutral}.",
    "- 'confidence' ∈ [0,1] (opcional).",
    "",
    "EJEMPLOS (malo → bueno):",
    "  'Genial'                     → 'Cliente muy satisfecho con el trato recibido' (positive)",
    "  'Rápidos'                    → 'Cliente valora atención rápida en mostrador' (positive)",
    "  'Mal teléfono'               → 'Dificultad para contactar por teléfono en horario laboral' (negative)",
    "  'Resultados 24h'             → 'Cliente valora resultados entregados en 24 horas' (positive/neutral según tono)",
    "  'Caro'                       → 'Percepción de precio elevado respecto a expectativas' (negative)",
    "",
    "DEVUELVE SOLO JSON.",
    "",
    "RESEÑA:",
    `\"\"\"${text ?? ""}\"\"\"`,
  ].join("\n");

  try {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      max_tokens: 260,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });

    const raw = resp.choices?.[0]?.message?.content?.trim() ?? "[]";
    const arr = safeParseArray(raw)
      .map(normalizeItem)
      .filter((x) => x.label && x.sentiment && wordCount(x.label) >= 4) // ⬅️ mínimo 4 palabras
      .slice(0, 6);

    return arr;
  } catch {
    return [];
  }
}

function safeParseArray(s: string): any[] {
  const cleaned = s.replace(/^```json\s*|\s*```$/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeItem(x: any): ExtractedConcept {
  const label = String(x?.label ?? "")
    .replace(/\.+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const sentimentRaw = String(x?.sentiment ?? "").toLowerCase();
  const sentiment: ExtractedConcept["sentiment"] =
    sentimentRaw === "positive" || sentimentRaw === "negative" || sentimentRaw === "neutral"
      ? (sentimentRaw as any)
      : "neutral";

  const conf = typeof x?.confidence === "number" ? clamp01(x.confidence) : undefined;

  // Capitaliza la primera letra para consistencia
  const clean =
    label.length > 0 ? label.charAt(0).toUpperCase() + label.slice(1) : label;

  return { label: clean, sentiment, confidence: conf };
}

function wordCount(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

function clamp01(n: number) {
  if (Number.isNaN(n)) return undefined;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
