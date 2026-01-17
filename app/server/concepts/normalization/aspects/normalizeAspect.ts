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

export async function normalizeAspectWithAI(
  input: NormalizeAspectInput,
  existingAspects: NormalizedAspect[],
): Promise<NormalizeAspectResult> {
  const sys = `
Eres un sistema de normalización semántica.

Tu tarea es decidir si un ASPECT de una reseña
corresponde a un aspect normalizado existente
o si representa una NUEVA dimensión de experiencia.

REGLAS:
- Normaliza SIGNIFICADO, no palabras exactas.
- Si el significado encaja claramente → MATCH.
- Si hay duda → CREATE.
- NO fuerces matches incorrectos.

Devuelve SOLO JSON.

Formato MATCH:
{
  "action": "match",
  "normalized_aspect_id": "...",
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
  return JSON.parse(raw);

}
