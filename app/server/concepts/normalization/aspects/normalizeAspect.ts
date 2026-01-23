// app/server/concepts/normalization/normalizeAspect.ts
import { openai } from "@/app/server/openaiClient";

type NormalizedAspect = {
  id: string;
  canonical_key: string;
  display_name: string;
  description: string | null;
  examples: string[];
};

export type NormalizeAspectInput = {
  aspect: string;
  entity?: string | null;
  descriptor?: string | null;
};

export type NormalizeAspectResult =
  | {
      action: "match";
      normalized_aspect_id: string;
      confidence: number;
    }
  | {
      action: "create";
      canonical_key: string;
      display_name: string;
      description: string;
      examples: string[];
      confidence: number;
    };

function clamp01(n: unknown, fallback = 0.8) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function safeString(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

export async function normalizeAspectWithAI(
  input: NormalizeAspectInput,
  existingAspects: NormalizedAspect[],
): Promise<NormalizeAspectResult> {
  const allowedIds = new Set(existingAspects.map((a) => a.id));
  const byCanonical = new Map(existingAspects.map((a) => [a.canonical_key, a.id]));
  const byDisplayLower = new Map(existingAspects.map((a) => [a.display_name.toLowerCase(), a.id]));

  const sys = `
Eres un sistema de normalización semántica.

Tu tarea es decidir si un ASPECT extraído de una reseña corresponde a un aspect normalizado existente
o si representa una NUEVA dimensión de experiencia.

OBJETIVO CLAVE:
- La tabla normalized_aspect es CANÓNICA y UNIVERSAL. Sus nombres deben servir igual para heladería, clínica, taller, gestoría.
- El display_name debe ser ATÓMICO y NEUTRO (sin contexto de producto/negocio y sin adjetivos evaluativos).

REGLAS:
- Normaliza SIGNIFICADO, no palabras exactas.
- Si el significado encaja claramente → MATCH.
- Si hay duda → CREATE.
- NO fuerces matches incorrectos.

IMPORTANTE (MATCH):
- Si haces MATCH, normalized_aspect_id DEBE ser exactamente uno de los IDs provistos en existing_aspects.
- No inventes IDs. Si no estás seguro, usa CREATE.

Devuelve SOLO JSON.

Formato MATCH:
{
  "action": "match",
  "normalized_aspect_id": "<id existente>",
  "confidence": 0.0-1.0
}

Formato CREATE:
{
  "action": "create",
  "canonical_key": "snake_case",
  "display_name": "Nombre legible",
  "description": "Qué mide este aspect",
  "examples": ["..."],
  "confidence": 0.0-1.0
}
`;

  const user = {
    input,
    existing_aspects: existingAspects.map((a) => ({
      id: a.id,
      canonical_key: a.canonical_key,
      display_name: a.display_name,
      description: a.description,
      examples: a.examples,
    })),
  };

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: JSON.stringify(user) },
    ],
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("normalizeAspectWithAI: respuesta vacía del modelo (content=null)");
  }

  const parsed = JSON.parse(raw) as any;

  const action = safeString(parsed.action).toLowerCase();

  // ---- MATCH (validado) ----
  if (action === "match") {
    const id = safeString(parsed.normalized_aspect_id);
    const confidence = clamp01(parsed.confidence, 0.9);

    if (id && allowedIds.has(id)) {
      return { action: "match", normalized_aspect_id: id, confidence };
    }

    // Reparación: si la IA devolvió canonical_key/display_name en vez de id, intentamos resolver.
    const maybeCanonical = safeString(parsed.canonical_key);
    if (maybeCanonical) {
      const resolved = byCanonical.get(maybeCanonical);
      if (resolved) {
        return { action: "match", normalized_aspect_id: resolved, confidence: 0.85 };
      }
    }

    const maybeDisplay = safeString(parsed.display_name).toLowerCase();
    if (maybeDisplay) {
      const resolved = byDisplayLower.get(maybeDisplay);
      if (resolved) {
        return { action: "match", normalized_aspect_id: resolved, confidence: 0.85 };
      }
    }

    // Si no podemos resolver a un ID real, degradamos a CREATE controlado.
    // Usamos input.aspect como base; mejor crear que enlazar mal.
    const fallbackName = safeString(input.aspect) || "Aspecto";
    const canonical_key = safeString(parsed.canonical_key) || fallbackName.toLowerCase().replace(/\s+/g, "_");
    const display_name = safeString(parsed.display_name) || fallbackName;
    const description = safeString(parsed.description) || "Aspecto normalizado (creado por fallback).";
    const examples = Array.isArray(parsed.examples) ? parsed.examples.map(safeString).filter(Boolean).slice(0, 5) : [];

    return {
      action: "create",
      canonical_key,
      display_name,
      description,
      examples,
      confidence: 0.6,
    };
  }

  // ---- CREATE (validado) ----
  if (action === "create") {
    const canonical_key = safeString(parsed.canonical_key);
    const display_name = safeString(parsed.display_name);
    const description = safeString(parsed.description);
    const confidence = clamp01(parsed.confidence, 0.8);
    const examples = Array.isArray(parsed.examples) ? parsed.examples.map(safeString).filter(Boolean).slice(0, 5) : [];

    if (!canonical_key || !display_name) {
      const fallbackName = safeString(input.aspect) || "Aspecto";
      return {
        action: "create",
        canonical_key: fallbackName.toLowerCase().replace(/\s+/g, "_"),
        display_name: fallbackName,
        description: description || "Aspecto normalizado (create con campos mínimos).",
        examples,
        confidence: 0.6,
      };
    }

    return { action: "create", canonical_key, display_name, description: description || "", examples, confidence };
  }

  // Acción desconocida -> CREATE seguro
  const fallbackName = safeString(input.aspect) || "Aspecto";
  return {
    action: "create",
    canonical_key: fallbackName.toLowerCase().replace(/\s+/g, "_"),
    display_name: fallbackName,
    description: "Aspecto normalizado (acción desconocida).",
    examples: [],
    confidence: 0.5,
  };
}
