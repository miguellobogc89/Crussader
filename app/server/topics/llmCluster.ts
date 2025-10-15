// app/server/topics/llmCluster.ts
// ===================================================
// 📌 Propósito:
// Agrupar *concepts* existentes usando la IA en clusters (topics).
//
// Flujo:
// - Lee concepts (por defecto SOLO los que no tienen topic_id).
// - Envía al LLM la lista {id, label} y pide agrupación JSON:
//     { topics: [{ label, description?, members: [conceptId, ...] }, ...] }
// - Si dryRun=true → devuelve la propuesta (no escribe en DB).
// - Si dryRun=false → crea topics y asigna concept.topic_id en transacción.
// - avg_rating del topic = media de concept.rating de sus miembros.
//
// Parámetros:
//   limit?: máx. concepts a considerar (default 200)
//   includeAssigned?: si true, incluye también ya asignados a topic
//   dryRun?: si true, no persiste cambios (default true)
// ===================================================

import { prisma } from "@/app/server/db";
import { openai } from "@/app/server/openaiClient";

type ConceptLite = {
  id: string;
  label: string;
  topic_id: string | null;
};

type LLMTopicsResponse = {
  topics: Array<{
    label: string;
    description?: string | null;
    members: string[];
  }>;
};

function buildPrompt(concepts: ConceptLite[]) {
  const items = concepts.map((c) => ({ id: c.id, label: c.label }));
  return [
    {
      role: "system" as const,
      content:
        "Eres un asistente que agrupa frases cortas (conceptos) en temas de negocio (topics) coherentes, útiles y accionables.",
    },
    {
      role: "user" as const,
      content: [
        "Tarea:",
        "- Te doy una lista de conceptos {id,label}.",
        "- Devuélveme una agrupación en formato JSON CONCRETO (response_format: json).",
        "- Reglas:",
        "  1) Crea entre 3 y 20 topics (flexible según datos).",
        "  2) Cada topic debe tener 'label' claro y 'members' con IDs de concepts.",
        "  3) No inventes IDs. No repitas un mismo concept en varios topics.",
        "  4) Evita topics genéricos como 'Otros'.",
        "  5) El label del topic debe sonar a categoría de negocio ('Dificultad para anular cita por teléfono', 'Seguimiento vía WhatsApp', 'Resultados en 24h', etc.).",
        "  6) Opcional: 'description' breve (1 frase) que aclare el alcance del topic.",
        "",
        "Ejemplo de salida estricta:",
        `{
  "topics": [
    { "label": "Seguimiento vía WhatsApp", "description": "Mensajes sobre confirmaciones y seguimiento por WhatsApp", "members": ["<conceptId1>", "<conceptId7>", "<conceptId23>"] },
    { "label": "Resultados en 24h", "members": ["<conceptId4>", "<conceptId12>"] }
  ]
}`,
        "",
        "Datos:",
        JSON.stringify(items, null, 2),
      ].join("\n"),
    },
  ];
}

export async function llmGroupConcepts(opts?: {
  limit?: number;
  includeAssigned?: boolean;
  dryRun?: boolean;
}) {
  const limit = Math.max(1, Math.min(1000, opts?.limit ?? 200));
  const includeAssigned = !!opts?.includeAssigned;
  const dryRun = opts?.dryRun !== false ? true : false;

  // 1) Cargar concepts
  // Prioriza por nº de vínculos (si existe la relación) y fecha de actualización
  const concepts = await prisma.concept.findMany({
    where: includeAssigned ? {} : { topic_id: null },
    orderBy: [
      { review_concept: { _count: "desc" } }, // requiere relación review_concept en el schema
      { updated_at: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      label: true,
      topic_id: true,
      updated_at: true,
    },
  });

  if (concepts.length === 0) {
    return {
      ok: true,
      taken: 0,
      createdTopics: 0,
      assignedConcepts: 0,
      preview: { topics: [] as any[] },
      note: includeAssigned
        ? "No hay concepts que agrupar (incluso incluyendo asignados)."
        : "No hay concepts sin topic pendientes.",
    };
  }

  // Adaptar a ConceptLite
  const lite: ConceptLite[] = concepts.map((c) => ({
    id: c.id,
    label: c.label,
    topic_id: c.topic_id,
  }));

  // 2) LLM → clustering
  const messages = buildPrompt(lite);
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages,
  });

  // Parseo robusto
  let json: LLMTopicsResponse | null = null;
  try {
    const raw = resp.choices?.[0]?.message?.content ?? "{}";
    json = JSON.parse(raw) as LLMTopicsResponse;
  } catch {
    const raw = resp.choices?.[0]?.message?.content ?? "{}";
    try {
      json = JSON.parse(raw) as LLMTopicsResponse;
    } catch {
      return {
        ok: false,
        error: "La IA no devolvió JSON válido para el clustering.",
        raw: resp.choices?.[0]?.message?.content,
      };
    }
  }

  if (!json?.topics || !Array.isArray(json.topics)) {
    return {
      ok: false,
      error: "Respuesta JSON sin 'topics' válido.",
      preview: json,
    };
  }

  // 3) Validación de members y deduplicación
  const conceptSet = new Set(lite.map((c) => c.id));
  const seen = new Set<string>();
  const cleaned = json.topics
    .map((t) => {
      const validMembers = (t.members || [])
        .filter((id) => conceptSet.has(id))
        .filter((id) => {
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      return {
        label: String(t.label || "").trim().slice(0, 120) || "Sin título",
        description: t.description ? String(t.description).slice(0, 240) : null,
        members: validMembers,
      };
    })
    .filter((t) => t.members.length > 0);

  if (cleaned.length === 0) {
    return {
      ok: true,
      taken: lite.length,
      createdTopics: 0,
      assignedConcepts: 0,
      preview: { topics: [] as any[] },
      note: "El LLM generó agrupaciones vacías tras limpiar IDs/duplicados.",
    };
  }

  // Si dryRun: solo preview
  if (dryRun) {
    return {
      ok: true,
      taken: lite.length,
      createdTopics: cleaned.length,
      assignedConcepts: cleaned.reduce((s, t) => s + t.members.length, 0),
      preview: { topics: cleaned },
      note: "dryRun=true (no se escribió nada).",
    };
  }

  // 4) Persistir en DB dentro de una transacción
  let created = 0;
  let assigned = 0;

  await prisma.$transaction(async (tx) => {
    for (const topic of cleaned) {
      // Media de concept.rating para los miembros del topic (SQL crudo por compat)
      const idsList = topic.members.map((id) => `'${id}'`).join(",");
      const avgRow = await tx.$queryRawUnsafe<{ avg: number | null }[]>(
        `SELECT AVG(rating)::float AS avg
         FROM concept
         WHERE id IN (${idsList}) AND rating IS NOT NULL`
      );
      const avg = avgRow?.[0]?.avg ?? null;

      const createdTopic = await tx.topic.create({
        data: {
          label: topic.label,
          description: topic.description ?? undefined,
          model: "gpt-4o-mini",
          concept_count: topic.members.length,
          avg_rating: avg, // 👈 media de estrellas de sus concepts
          is_stable: topic.members.length >= 3,
        },
        select: { id: true },
      });

      await tx.concept.updateMany({
        where: { id: { in: topic.members } },
        data: { topic_id: createdTopic.id, updated_at: new Date() },
      });

      created += 1;
      assigned += topic.members.length;
    }
  });

  return {
    ok: true,
    taken: lite.length,
    createdTopics: created,
    assignedConcepts: assigned,
    preview: { topics: cleaned },
  };
}
