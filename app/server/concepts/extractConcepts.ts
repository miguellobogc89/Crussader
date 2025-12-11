// app/server/concepts/extractConcepts.ts
// =====================================================
// Extractor orientado a NEGOCIO con CONCEPTOS ESTRUCTURADOS.
//
// Cada concepto es una idea concreta con campos:
//  - entity     → objeto del que se habla (helado de chocolate, cucurucho…)
//  - aspect     → qué parte se valora (sabor, precio, tiempo de espera…)
//  - judgment   → positive | negative | neutral
//  - intensity  → 0..1 fuerza de la opinión
//  - descriptor → detalle cualitativo libre
//  - category   → macro categoría (producto, servicio, precio, instalaciones…)
//  - summary    → frase resumen lista para mostrar al usuario
//
// Y por compatibilidad mantenemos:
//  - sentiment  → = judgment
//  - confidence → = intensity
//
// Devuelve siempre: ExtractedConcept[] = [{
//   entity, aspect, judgment, intensity, descriptor?, category, summary,
//   sentiment, confidence?
// }]
// =====================================================

import { openai } from "../openaiClient";

const MODEL = "gpt-4o-mini";

export type ExtractedConcept = {
  entity: string;
  aspect: string;
  judgment: "positive" | "negative" | "neutral";
  intensity: number; // 0..1
  descriptor?: string;
  category: string;
  summary: string;

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
    "Tu misión es convertir una reseña en 0–6 CONCEPTOS ESTRUCTURADOS, cada uno representando UNA idea concreta y accionable.",
    "",
    "Cada concepto debe tener estos campos:",
    "  entity     → objeto concreto del que se habla (producto, servicio específico, parte de las instalaciones, etc.)",
    "  aspect     → qué parte se evalúa (sabor, precio, variedad, cantidad, tiempo de espera, limpieza, amabilidad, etc.)",
    "  judgment   → 'positive' | 'negative' | 'neutral'",
    "  intensity  → número entre 0 y 1 que indica cuán fuerte es la opinión",
    "  descriptor → breve frase con el matiz ('muy sabroso', 'precio demasiado alto', 'espera interminable')",
    "  category   → macro categoría del concepto, por ejemplo:",
    "               'producto', 'servicio', 'precio', 'instalaciones', 'accesibilidad', 'tiempo', 'variedad', 'disponibilidad', 'resultado', 'experiencia'",
    "  summary    → frase corta (máx. ~18 palabras) que resuma el concepto y sea útil para el dueño del negocio",
    "",
    "Además, por compatibilidad, incluye también:",
    "  sentiment  → igual que judgment",
    "  confidence → igual que intensity (0..1)",
    "",
    "Prioriza conceptos que ayuden a tomar decisiones de negocio:",
    "- Productos concretos (sabores, platos, tratamientos…) y su aceptación",
    "- Precio y relación calidad/precio",
    "- Tiempos de espera y organización (momentos del día, colas, rapidez en servir)",
    "- Disponibilidad (productos agotados, falta de opciones para intolerancias, etc.)",
    "- Instalaciones (limpieza, comodidad, ruido, accesibilidad física)",
    "- Servicio al cliente (trato, profesionalidad) SOLO si hay matices específicos",
    "",
    "Evita conceptos genéricos y vacíos como:",
    "- 'Buen servicio en general'",
    "- 'Todo perfecto'",
    "- 'Experiencia muy buena' sin detalle",
    "",
    "IMPORTANTE sobre la diversidad dentro de UNA reseña:",
    "- No repitas dos conceptos con la misma combinación entity + aspect + judgment.",
    "- Si la reseña repite la misma idea, genera UN solo concepto representativo.",
    "- Si hay varios temas distintos (precio, sabor, tiempo de espera…), intenta cubrir temas diferentes.",
    "",
    "Ejemplos de buenos conceptos:",
    "{",
    '  "entity": "helado de chocolate",',
    '  "aspect": "sabor",',
    '  "judgment": "positive",',
    '  "intensity": 0.9,',
    '  "descriptor": "muy cremoso y sabroso",',
    '  "category": "producto",',
    '  "summary": "Cliente muy satisfecho con el sabor del helado de chocolate",',
    '  "sentiment": "positive",',
    '  "confidence": 0.9',
    "}",
    "{",
    '  "entity": "cucurucho",',
    '  "aspect": "precio",',
    '  "judgment": "negative",',
    '  "intensity": 0.85,',
    '  "descriptor": "precio percibido como demasiado alto",',
    '  "category": "precio",',
    '  "summary": "Clientes perciben el precio del cucurucho como demasiado alto",',
    '  "sentiment": "negative",',
    '  "confidence": 0.85',
    "}",
    "{",
    '  "entity": "helado sin lactosa",',
    '  "aspect": "disponibilidad",',
    '  "judgment": "negative",',
    '  "intensity": 0.9,',
    '  "descriptor": "faltan opciones para intolerantes a la lactosa",',
    '  "category": "disponibilidad",',
    '  "summary": "Falta de opciones de helados sin lactosa para clientes intolerantes",',
    '  "sentiment": "negative",',
    '  "confidence": 0.9',
    "}",
    "",
    "Normas importantes:",
    "- Devuelve entre 0 y 6 conceptos por reseña.",
    "- No repitas conceptos casi iguales.",
    "- Prefiere pocos conceptos muy concretos a muchos conceptos vagos.",
    "",
    "Responde SOLO JSON. Formato: array de objetos con esos campos.",
    "Ejemplo: [ { ... }, { ... } ]",
    "",
    businessType
      ? `Tipo de negocio: ${businessType}. Prioriza conceptos relevantes para este tipo.`
      : "",
    activityName
      ? `Actividad específica: ${activityName}. Ajusta la elección de conceptos.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const user = [
    "RESEÑA DEL CLIENTE:",
    `\"\"\"${text ?? ""}\"\"\"`,
    "",
    businessName ? `Nombre del negocio: ${businessName}` : "",
    "",
    "Devuelve SOLO JSON sin texto adicional.",
  ]
    .filter(Boolean)
    .join("\n");

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
      .filter((x) => x.summary && x.entity && x.aspect)
      .slice(0, 6);

    return arr;
  } catch (err) {
    console.error("extractConceptsFromReview error:", err);
    return [];
  }
}

/**
 * Intenta parsear JSON de manera robusta:
 *  - Respuestas con ```json ... ```
 *  - Texto antes/después
 *  - Objeto único o { concepts: [...] }
 */
function safeParseArray(s: string): any[] {
  let cleaned = s.replace(/^```json\s*|\s*```$/g, "").trim();

  const tryParse = (text: string): any[] => {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;

      if (parsed && typeof parsed === "object") {
        if (Array.isArray((parsed as any).concepts)) {
          return (parsed as any).concepts;
        }
        return [parsed];
      }

      return [];
    } catch {
      return [];
    }
  };

  let result = tryParse(cleaned);
  if (result.length > 0) return result;

  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const slice = cleaned.slice(firstBracket, lastBracket + 1);
    result = tryParse(slice);
    if (result.length > 0) return result;
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const slice = cleaned.slice(firstBrace, lastBrace + 1);
    result = tryParse(slice);
    if (result.length > 0) return result;
  }

  console.warn("safeParseArray: no se pudo parsear respuesta de modelo:", s);
  return [];
}

function normalizeJudgment(v: any): ExtractedConcept["judgment"] {
  const raw = String(v ?? "").toLowerCase();
  if (raw === "positive" || raw === "negative" || raw === "neutral") {
    return raw;
  }
  return "neutral";
}

function normalizeCategory(v: any): string {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return "otro";
  return s;
}

function clamp01(n: any, def = 0.5): number {
  let x = Number(n);
  if (!Number.isFinite(x)) x = def;
  if (x < 0) x = 0;
  if (x > 1) x = 1;
  return x;
}

/**
 * Acepta tanto el formato nuevo como el antiguo:
 *  - Nuevo: { entity, aspect, judgment, intensity, descriptor, category, summary, sentiment, confidence }
 *  - Antiguo: { label, sentiment, confidence }
 */
function normalizeItem(x: any): ExtractedConcept {
  const rawLabel = String(x?.label ?? "").trim();
  const rawSummary = String(x?.summary ?? "").trim();

  let entity = String(x?.entity ?? "").trim();
  let aspect = String(x?.aspect ?? "").trim();
  let descriptor = String(x?.descriptor ?? "").trim();
  let category = normalizeCategory(x?.category);

  let summary = rawSummary || rawLabel;

  const baseJudgment = x?.judgment ?? x?.sentiment;
  const judgment = normalizeJudgment(baseJudgment);

  const baseIntensity = x?.intensity ?? x?.confidence;
  const intensity = clamp01(baseIntensity, 0.7);

  if (!entity && descriptor) {
    entity = "producto o servicio";
  }
  if (!entity && !descriptor && summary) {
    entity = "experiencia general";
  }
  if (!aspect) {
    aspect = "experiencia general";
  }

  if (!summary) {
    const base =
      judgment === "positive"
        ? "Cliente satisfecho"
        : judgment === "negative"
          ? "Cliente insatisfecho"
          : "Comentario neutro del cliente";

    const parts: string[] = [];
    if (entity) parts.push(entity);
    if (aspect) parts.push(aspect);
    if (descriptor) parts.push(descriptor);

    summary = `${base} con ${parts.join(" / ")}`.slice(0, 160);
  }

  const finalSummary =
    summary.length > 0 ? summary.charAt(0).toUpperCase() + summary.slice(1) : summary;

  const sentiment: ExtractedConcept["sentiment"] = judgment;
  const confidence = intensity;

  return {
    entity,
    aspect,
    judgment,
    intensity,
    descriptor: descriptor || undefined,
    category,
    summary: finalSummary,
    sentiment,
    confidence,
  };
}
