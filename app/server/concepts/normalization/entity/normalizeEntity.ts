// app/server/concepts/normalization/entity/normalizeEntity.ts
import { openai } from "@/app/server/openaiClient";
import { canonicalizeKey } from "../canonicalizeKey";

const MODEL = "gpt-4o-mini";

export type NormalizeEntityInput = {
  entity: string;
  aspect?: string | null;
  businessType?: string | null;
  activityName?: string | null;

  // candidatos existentes para matching rápido
  candidates?: Array<{
    id: string;
    display_name: string;
    canonical_key: string;
  }>;
};

export type NormalizeEntityResult =
  | {
      action: "match";
      normalized_entity_id: string;
      confidence: number; // 0..1
      display_name?: string;
      canonical_key?: string;
    }
  | {
      action: "create";
      canonical_key: string;
      display_name: string;
      description?: string | null;
      examples?: string[];
      confidence: number; // 0..1
    };

function clamp01(n: any, def = 0.8): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return def;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export async function normalizeEntity(input: NormalizeEntityInput): Promise<NormalizeEntityResult> {
  const entityRaw = String(input.entity ?? "").trim();
  const aspectRaw = String(input.aspect ?? "").trim();
  if (!entityRaw) {
    return {
      action: "create",
      canonical_key: "",
      display_name: "",
      description: null,
      examples: [],
      confidence: 0,
    };
  }

  const detKey = canonicalizeKey(entityRaw);

  // Si hay candidato con canonical_key igual, matcheamos determinista (sin IA)
  if (input.candidates && input.candidates.length > 0) {
    const exact = input.candidates.find((c) => c.canonical_key === detKey);
    if (exact) {
      return {
        action: "match",
        normalized_entity_id: exact.id,
        confidence: 0.95,
        display_name: exact.display_name,
        canonical_key: exact.canonical_key,
      };
    }
  }

  // Prompt IA para decidir match/create (sin reglas por negocio)
const sys = [
  "Eres un normalizador de ENTIDADES de reseñas para analítica de negocio.",
  "Tu misión: dado un entity raw (texto libre) y un contexto mínimo, devolver una entidad canónica (display_name) y metadata.",
  "",
  "FORMATO DE RESPUESTA (OBLIGATORIO):",
  'Devuelve SOLO JSON como OBJETO con esta forma exacta:',
  '{"action":"match"|"create","confidence":0..1,"display_name":"...","description":"...","examples":["..."],"normalized_entity_id"?: "..."}',
  "No incluyas texto fuera del JSON.",
  "",
  "REGLA CRÍTICA: display_name debe ser CANÓNICO, estable y REUTILIZABLE.",
  "",
  "NORMALIZACIÓN DE display_name (OBLIGATORIO):",
  "- Siempre en singular.",
  "- Sin determinantes: prohibido empezar por 'el', 'la', 'los', 'las', 'un', 'una'.",
  "- Sin adjetivos emocionales ('increíble', 'malísimo', etc.).",
  "- Mantén el nombre específico si existe: 'helado de barquillo', 'pago con tarjeta', 'tiempo de espera'.",
  "- Si es personal: usa 'personal' (no roles como 'dependiente', ni nombres propios).",
  "- Mantén marcas/propios raros tal cual (p.ej. 'Frigo', 'Camy').",
  "",
  "ACCIÓN:",
  "- action='match' SOLO si estás seguro de que corresponde a una entidad existente (se te pasarán candidatos).",
  "- Si dudas, action='create'.",
  "",
  "PROHIBIDO:",
  "- No sugieras acciones ('mejorar', 'revisar', etc.).",
  "- No inventes categorías ni agrupaciones.",
].join("\n");


  const candidatesText =
    (input.candidates ?? [])
      .slice(0, 60)
      .map((c) => `- ${c.id} | ${c.display_name} | ${c.canonical_key}`)
      .join("\n") || "(sin candidatos)";

  const user = [
    "ENTITY ORIGINAL:",
    entityRaw,
    aspectRaw ? `ASPECT (contexto): ${aspectRaw}` : "",
    "",
    "CANDIDATOS EXISTENTES (id | display_name | canonical_key):",
    candidatesText,
    "",
    "Devuelve SOLO JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  const resp = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    max_tokens: 250,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
  });

  const raw = resp.choices?.[0]?.message?.content?.trim() ?? "{}";

  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const action = String(parsed.action ?? "").toLowerCase();

  if (action === "match") {
    const id = String(parsed.normalized_entity_id ?? "").trim();
    if (!id) {
      // fallback -> create
      return {
        action: "create",
        canonical_key: detKey,
        display_name: entityRaw,
        description: null,
        examples: [entityRaw],
        confidence: 0.6,
      };
    }

    return {
      action: "match",
      normalized_entity_id: id,
      confidence: clamp01(parsed.confidence, 0.8),
    };
  }

  // create
  const display = String(parsed.display_name ?? entityRaw).trim();
  const canonical_key = canonicalizeKey(display);

  return {
    action: "create",
    canonical_key,
    display_name: display,
    description: parsed.description ? String(parsed.description).trim() : null,
    examples: Array.isArray(parsed.examples) ? parsed.examples.map((x: any) => String(x)).slice(0, 8) : [entityRaw],
    confidence: clamp01(parsed.confidence, 0.75),
  };
}
