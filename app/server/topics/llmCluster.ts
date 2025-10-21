// app/server/topics/llmCluster.ts
import { prisma } from "@/app/server/db";
import { openai } from "@/app/server/openaiClient";
import { generateAndStoreTopicDescription } from "./generateTopicDescription";

/* ───────── Types ───────── */
type ConceptRow = { id: string; label: string; rating: number | null; topic_id: string | null };
type ConceptLite = { id: string; label: string };
type LLMTopicsResponse = { topics: Array<{ topic_label?: string; label?: string; description?: string | null; members: string[] }> };
type CleanedTopic = { label: string; description: string | null; members: string[] };
type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

/* ───────── LLM helper ───────── */
async function callLLM(messages: ChatMsg[]): Promise<string> {
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages,
  });
  return resp.choices[0]?.message?.content ?? "{}";
}

/* ───────── Prompt para topics concretos ───────── */
function buildMessagesForClustering(items: ConceptLite[], minTopicSize: number) {
  const system = [
    "Eres un analista que agrupa conceptos {id,label} en TOPICS claros y cualitativos.",
    "Reglas del nombre del topic:",
    "- Lenguaje natural, informativo y específico (3–8 palabras).",
    "- Evita 'Valoración de…/Opinión sobre…'.",
    "- Prefiere formulaciones como: 'Calidad de las instalaciones', 'Problemas con la centralita telefónica', 'Confirmaciones por WhatsApp bien valoradas', 'Dificultad para reprogramar citas', 'Esperas prolongadas en recepción'.",
    "- Varía el inicio (Calidad…, Problemas…, Dificultad…, Atención…, Seguimiento…).",
    "- Indica implícitamente si la señal es positiva, negativa o neutra.",
    "",
    `Política de agrupación: tamaño mínimo = ${minTopicSize} (no grupos de 1), sin inventar ni duplicar IDs.`,
  ].join("\n");

  const user = [
    "Agrupa y devuelve JSON EXACTO:",
    "{",
    '  "topics": [',
    '    { "topic_label": "nombre cualitativo del topic", "members": ["id1","id2","..."] }',
    "  ]",
    "}",
    "",
    "Datos:",
    JSON.stringify(items, null, 2),
  ].join("\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

/* ───────── Carga de conceptos candidatos ───────── */
async function loadCandidateConcepts(params: {
  locationId?: string | null;
  companyId?: string | null;
  recencyDays?: number;
  limit?: number;
  /** si true, incluye conceptos ya asignados (solo si el topic no es estable); si false, solo sin topic */
  includeAssigned?: boolean;
}): Promise<ConceptRow[]> {
  const recencyDays = Math.max(1, Math.min(3650, params.recencyDays ?? 365));
  const limit = Math.max(1, Math.min(2000, params.limit ?? 500));
  const includeAssigned = params.includeAssigned === true;

  // WHERE dinámico según includeAssigned
  // - includeAssigned=false -> SOLO sin topic
  // - includeAssigned=true  -> sin topic O asignados a topic no estable
  const topicWhere = includeAssigned
    ? ` (c.topic_id IS NULL OR COALESCE(t.is_stable, false) = false) `
    : ` (c.topic_id IS NULL) `;

  const sql = `
    SELECT c.id::text, c.label, c.rating, c.topic_id
    FROM concept c
    JOIN "Review" r ON r.id = c.review_id
    LEFT JOIN topic t ON t.id = c.topic_id
    WHERE
      COALESCE(r."createdAtG", r."ingestedAt") >= (now() - make_interval(days => $1::int))
      AND ($2::text IS NULL OR r."locationId" = $2::text)
      AND ($3::text IS NULL OR r."companyId"  = $3::text)
      AND ${topicWhere}
    ORDER BY c.updated_at DESC NULLS LAST
    LIMIT $4::int
  `;

  return prisma.$queryRawUnsafe<ConceptRow[]>(
    sql,
    recencyDays,
    params.locationId ?? null,
    params.companyId ?? null,
    limit
  );
}

/* ───────── Util fallback descripción corta ───────── */
function fallbackShortDescription(members: string[], byId: Map<string, ConceptRow>): string | null {
  const phrases: string[] = [];
  for (const id of members) {
    const lbl = (byId.get(id)?.label || "").replace(/\.$/, "").trim();
    if (!lbl) continue;
    const lower = lbl.toLowerCase();
    if (!phrases.some((p) => p.toLowerCase() === lower)) phrases.push(lbl);
    if (phrases.length >= 3) break;
  }
  if (!phrases.length) return null;
  const raw = phrases.join("; ");
  return raw.length > 200 ? raw.slice(0, 200) + "…" : raw;
}

/* ───────── Preview ───────── */
export async function llmGroupConceptsPreview(
  limit = 200,
  scope?: { locationId?: string | null; companyId?: string | null; recencyDays?: number; includeAssigned?: boolean }
) {
  const concepts = await loadCandidateConcepts({
    locationId: scope?.locationId ?? null,
    companyId: scope?.companyId ?? null,
    recencyDays: scope?.recencyDays ?? 365,
    includeAssigned: scope?.includeAssigned === true,
    limit,
  });

  if (!concepts.length) return { ok: true, note: "No hay conceptos pendientes.", preview: [] as any[] };

  const items: ConceptLite[] = concepts.map((c) => ({ id: c.id, label: c.label }));
  const messages = buildMessagesForClustering(items, 2);
  const raw = await callLLM(messages);

  let json: LLMTopicsResponse | null = null;
  try { json = JSON.parse(raw) as LLMTopicsResponse; }
  catch { return { ok: false, error: "Respuesta inválida del modelo." }; }

  const table: Array<{ concept: string; topic_label: string; rating: number | null }> = [];
  const byId = new Map<string, ConceptRow>(concepts.map((c) => [c.id, c]));

  for (const t of json?.topics ?? []) {
    const topicLabel = (t.topic_label || t.label || "Sin título").toString();
    for (const id of (t.members ?? []) as string[]) {
      const c = byId.get(id);
      if (c) table.push({ concept: c.label, topic_label: topicLabel, rating: c.rating });
    }
  }
  return { ok: true, preview: table };
}

/* ───────── Persistencia ───────── */
export async function llmGroupConcepts(opts?: {
  locationId?: string | null;
  companyId?: string | null;
  recencyDays?: number;
  limit?: number;
  minTopicSize?: number;  // default 2
  dryRun?: boolean;       // default true
  includeAssigned?: boolean; // default false
}) {
  const minTopicSize = Math.max(2, Math.min(10, opts?.minTopicSize ?? 2));
  const dryRun = opts?.dryRun !== false ? true : false;
  const includeAssigned = opts?.includeAssigned === true;

  const concepts = await loadCandidateConcepts({
    locationId: opts?.locationId ?? null,
    companyId: opts?.companyId ?? null,
    recencyDays: opts?.recencyDays ?? 365,
    includeAssigned,
    limit: opts?.limit ?? 500,
  });

  if (!concepts.length) {
    return {
      ok: true,
      taken: 0,
      createdTopics: 0,
      assignedConcepts: 0,
      preview: { topics: [] as any[] },
      note: "No hay conceptos pendientes en este alcance."
    };
  }

  const items: ConceptLite[] = concepts.map((c) => ({ id: c.id, label: c.label }));
  const messages = buildMessagesForClustering(items, minTopicSize);
  const raw = await callLLM(messages);

  let json: LLMTopicsResponse | null = null;
  try { json = JSON.parse(raw) as LLMTopicsResponse; }
  catch { return { ok: false, error: "La IA no devolvió JSON válido para el clustering." }; }

  if (!json?.topics || !Array.isArray(json.topics)) {
    return { ok: false, error: "Respuesta JSON sin 'topics' válido.", preview: json };
  }

  const conceptSet = new Set<string>(concepts.map((c) => c.id));
  const seen = new Set<string>();

  const cleaned: CleanedTopic[] = json.topics
    .map((t) => {
      const rawLabel = String((t.topic_label ?? t.label ?? "").toString().trim()).slice(0, 120);
      const label = rawLabel && rawLabel.length >= 3 ? rawLabel : "Tema concreto";
      const validMembers = (t.members ?? [])
        .filter((id: string) => conceptSet.has(id))
        .filter((id: string) => { if (seen.has(id)) return false; seen.add(id); return true; });
      return { label, description: t.description ? String(t.description).slice(0, 240) : null, members: validMembers };
    })
    .filter((t) => t.members.length >= minTopicSize)
    .sort((a, b) => b.members.length - a.members.length);

  if (!cleaned.length) {
    return {
      ok: true,
      taken: concepts.length,
      createdTopics: 0,
      assignedConcepts: 0,
      preview: { topics: [] as any[] },
      note: `El LLM generó agrupaciones < ${minTopicSize} miembros; descartadas.`
    };
  }

  if (dryRun) {
    const assignedConcepts = cleaned.reduce((sum, t) => sum + t.members.length, 0);
    return {
      ok: true,
      taken: concepts.length,
      createdTopics: cleaned.length,
      assignedConcepts,
      preview: { topics: cleaned },
      note: "dryRun=true (no se escribió nada)."
    };
  }

  const byId = new Map<string, ConceptRow>(concepts.map((c) => [c.id, c]));
  let created = 0;
  let assigned = 0;
  const createdTopicIds: string[] = [];

  for (const topic of cleaned) {
    const ratings = topic.members
      .map((id) => byId.get(id)?.rating)
      .filter((n): n is number => typeof n === "number");
    const avgRounded = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
      : null;

    const fallbackDesc = fallbackShortDescription(topic.members, byId);

    const createdTopic = await prisma.topic.create({
      data: {
        label: topic.label,
        description: fallbackDesc || null, // se reemplaza luego por la IA
        model: "gpt-4o-mini",
        concept_count: topic.members.length,
        avg_rating: avgRounded ?? undefined,
        is_stable: topic.members.length > 3,
      },
      select: { id: true },
    });

    await prisma.concept.updateMany({
      where: { id: { in: topic.members } },
      data: { topic_id: createdTopic.id, updated_at: new Date(), assigned_at: new Date() },
    });

    createdTopicIds.push(createdTopic.id);
    created++;
    assigned += topic.members.length;
  }

  // Descripciones IA post-persistencia (centralizado)
  for (const id of createdTopicIds) {
    try { await generateAndStoreTopicDescription(id); } catch { /* fallback ya persistido */ }
  }

  return {
    ok: true,
    taken: concepts.length,
    createdTopics: created,
    assignedConcepts: assigned,
    preview: { topics: cleaned }
  };
}
