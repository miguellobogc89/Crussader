// app/server/concepts/extractConcepts.ts
// =====================================================
// FASE A — EXTRACCIÓN DE CONCEPTS (sin normalización hardcodeada)
// + incluye review_text (TEXT) para trazabilidad
//
// Objetivo:
// - 0..6 conceptos por reseña con estructura estable.
// - Sin category, sin mappings por negocio, sin normalizadores deterministas.
// - La normalización/canonical vendrá en FASE B (clusters + IA).
//
// Campos por concepto:
//  - entity
//  - aspect
//  - judgment
//  - intensity
//  - descriptor
//  - summary
//  - review_text (se añade en servidor)
//
// Compat:
//  - sentiment  = judgment
//  - confidence = intensity
// =====================================================

import { openai } from "../openaiClient";

const MODEL = "gpt-4o-mini";

export type ExtractedConcept = {
  entity: string;
  aspect: string;
  judgment: "positive" | "negative" | "neutral";
  intensity: number; // 0..1
  descriptor?: string;
  summary: string;

  // trazabilidad
  review_text: string;

  // compat
  sentiment: "positive" | "negative" | "neutral";
  confidence?: number;
};

export async function extractConceptsFromReview(
  text: string,
  context?: {
    businessName?: string | null;
    businessType?: string | null;
    activityName?: string | null;
  },
): Promise<ExtractedConcept[]> {
  const { businessName, businessType, activityName } = context || {};

  const sys = [
    "Eres un analista experto en EXPERIENCIA DE CLIENTE para negocios cara al público.",
    "Tu misión es convertir UNA reseña en 0–6 CONCEPTOS ESTRUCTURADOS.",
    "Cada concepto representa UNA idea concreta y accionable.",
    "",
    "FORMATO DE RESPUESTA (OBLIGATORIO):",
    'Devuelve SOLO JSON como OBJETO con esta forma exacta: {"concepts":[{...},{...}]}',
    "No incluyas texto fuera del JSON.",
    "",
    "CAMPOS OBLIGATORIOS por concepto:",
    "  entity     → objeto CONCRETO del que se habla (producto/servicio/parte del local/proceso).",
    "  aspect     → dimensión evaluable (p.ej. sabor, precio, limpieza, espera, amabilidad, variedad, disponibilidad...).",
    "  judgment   → 'positive' | 'negative' | 'neutral'",
    "  intensity  → número 0..1 (fuerza de la opinión)",
    "  descriptor → matiz breve y factual (no un resumen largo).",
    "  summary    → frase corta (máx ~18 palabras) útil para el dueño del negocio.",
    "REGLA CRÍTICA (NO ACCIONES):",
"- summary y descriptor deben describir lo que el cliente afirma/percebe, NO sugerir acciones.",
"- Prohibido usar verbos imperativos o de tarea en summary/descriptor: 'revisar', 'mejorar', 'aumentar', 'evitar', 'ofrecer', 'incluir', 'cambiar', 'arreglar'.",
"- Formato correcto de summary (descriptivo):",
"  'Cliente percibe el precio del helado de barquillo como alto para la cantidad ofrecida'.",
"  'Cliente valora positivamente la amabilidad del personal'.",
"  'Cliente menciona tiempos de espera largos'.",
    "",
    "REGLAS CLAVE (calidad y escalabilidad):",
    "- NO inventes. Si algo no está en la reseña, no lo incluyas.",
    "- No infieras causas, motivaciones ni intenciones del negocio; limítate a la percepción del cliente.",
    "- Si la reseña es vaga ('todo perfecto', 'muy bien') y no hay detalle accionable, devuelve 0 conceptos.",
    "",
    "REGLAS PARA entity (MUY IMPORTANTE):",
    "- Si la reseña menciona un elemento ESPECÍFICO, úsalo como entity.",
    "  Ej: 'helado de pistacho', 'café con leche', 'pago con tarjeta', 'terraza', 'baño', 'tiempo de espera'.",
    "- Evita entities genéricas ('helados', 'producto', 'servicio', 'sitio', 'lugar') SI hay algo más concreto en el texto.",
    "- entity en singular y sin determinantes ('el/la/los/las').",
    "- Si aparece un nombre propio del personal, NO uses el nombre como entity; usa 'personal' y mete el nombre en descriptor.",
    "- Si hay un término raro que podría ser sabor/marca (p.ej. palabra corta o nombre), consérvalo tal cual (NO lo corrijas).",
    "",
    "REGLAS PARA aspect:",
    "- aspect debe ser una dimensión evaluable (evita 'general', 'todo', 'experiencia general').",
    "- No uses 'servicio' como aspect; si la idea es humana, usa aspect tipo 'amabilidad', 'profesionalidad' o 'resolución'.",
    "",
    "DIVERSIDAD dentro de UNA reseña:",
    "- No repitas dos conceptos con la misma combinación entity + aspect + judgment.",
    "- Si una frase contiene dos juicios distintos sobre la misma entidad ('rico pero caro'), sepáralo en 2 conceptos.",
    "",
    businessType ? `Tipo de negocio: ${businessType}.` : "",
    activityName ? `Actividad específica: ${activityName}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const user = [
    "RESEÑA DEL CLIENTE:",
    `"""${text ?? ""}"""`,
    "",
    businessName ? `Nombre del negocio: ${businessName}` : "",
    "",
    'Devuelve SOLO JSON con la forma {"concepts":[...]} sin texto adicional.',
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      max_tokens: 420,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });

    const raw = resp.choices?.[0]?.message?.content?.trim() ?? '{"concepts":[]}';

    const arr = safeParseArray(raw)
      .map((x) => normalizeItem(x))
      .filter((x): x is Omit<ExtractedConcept, "review_text"> => Boolean(x))
      .map((c) => ({ ...c, review_text: String(text ?? "") }))
      .slice(0, 6);

    return arr;
  } catch (err) {
    // Solo errores
    console.error("extractConceptsFromReview error:", err);
    return [];
  }
}

/**
 * Parseo robusto:
 * - ```json ... ```
 * - { concepts: [...] }
 * - [...]
 * - { ... }
 */
function safeParseArray(s: string): any[] {
  const cleaned = String(s ?? "").replace(/^```json\s*|\s*```$/g, "").trim();

  const tryParse = (text: string): any[] | null => {
    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) return parsed;

      if (parsed && typeof parsed === "object") {
        const concepts = (parsed as any).concepts;
        if (Array.isArray(concepts)) return concepts;

        return [parsed];
      }

      return null;
    } catch {
      return null;
    }
  };

  let result = tryParse(cleaned);
  if (result !== null) return result;

  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const slice = cleaned.slice(firstBracket, lastBracket + 1);
    result = tryParse(slice);
    if (result !== null) return result;
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const slice = cleaned.slice(firstBrace, lastBrace + 1);
    result = tryParse(slice);
    if (result !== null) return result;
  }

  return [];
}

function normalizeJudgment(v: any): "positive" | "negative" | "neutral" {
  const raw = String(v ?? "").toLowerCase();
  if (raw === "positive" || raw === "negative" || raw === "neutral") return raw;
  return "neutral";
}

function clamp01(n: any, def = 0.6): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return def;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * Normalización mínima (NO semántica):
 * - valida estructura
 * - filtra basura universal
 */
function normalizeItem(x: any): Omit<ExtractedConcept, "review_text"> | null {
  const entity = String(x?.entity ?? "").trim();
  const aspect = String(x?.aspect ?? "").trim();
  const summaryRaw = String(x?.summary ?? "").trim();

  if (!entity || !aspect || !summaryRaw) return null;

  // filtros universales (no por negocio)
  const e = entity.toLowerCase();
  if (
    e === "todo" ||
    e === "esto" ||
    e === "experiencia general" ||
    e === "producto o servicio" ||
    e === "el sitio" ||
    e === "sitio" ||
    e === "lugar"
  ) {
    return null;
  }

  const a = aspect.toLowerCase();
  if (a === "general" || a === "experiencia general" || a === "todo") return null;

  const judgment = normalizeJudgment(x?.judgment ?? x?.sentiment);
  const intensity = clamp01(x?.intensity ?? x?.confidence, 0.6);

  const descriptor = String(x?.descriptor ?? "").trim();

  const summary =
    summaryRaw.length > 0 ? summaryRaw.charAt(0).toUpperCase() + summaryRaw.slice(1) : "";

  return {
    entity,
    aspect,
    judgment,
    intensity,
    descriptor: descriptor || undefined,
    summary,
    sentiment: judgment,
    confidence: intensity,
  };
}
