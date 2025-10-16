// app/server/topics/llmCluster.ts
import { prisma } from "@/app/server/db";
import { openai } from "@/app/server/openaiClient";
import { generateAndStoreTopicDescription } from "@/app/server/topics/generateTopicDescription";

/* ───────────────────────────── Types ───────────────────────────── */

type ConceptRow = {
  id: string;
  label: string;
  rating: number | null;
  topic_id: string | null;
};

type ConceptLite = { id: string; label: string };

type LLMTopicsResponse = {
  topics: Array<{
    topic_label?: string;
    label?: string;
    description?: string | null;
    members: string[];
  }>;
};

type CleanedTopic = { label: string; description: string | null; members: string[] };

/* ─────────────────────────── Prompt base ───────────────────────── */

function buildMessagesForClustering(items: ConceptLite[], minTopicSize: number) {
  const system = [
    "Eres un asistente que agrupa conceptos {id,label} en CATEGORÍAS DE NEGOCIO reutilizables y accionables.",
    "Objetivo: que cualquier negocio entienda qué áreas funcionan y cuáles no.",
    "",
    "REGLAS ESTRICTAS",
    "1) Etiqueta cada topic con un SUSTANTIVO/ÁREA (2–4 palabras).",
    "   Con adjetivos y juicios ('bueno/malo', 'problemas de...', 'Excelente..'). ",
    `2) Tamaño mínimo del topic = ${minTopicSize}. NO crees grupos de 1.`,
    "3) Agrupa por similitud semántica. Une wording similar/sinónimos.",
    "4) No inventes IDs. No repitas un ID en varios topics.",
    "",
    "TAXONOMÍA SEMILLA (orientativa; usa cuando aplique o crea similares sin adjetivos):",
    "- Atención al cliente",
    "- Soporte y posventa",
    "- Producto y calidad",
    "- Precio y percepción",
    "- Entregas y plazos",
    "- Citas y puntualidad",
    "- Pagos y facturación",
    "- Canales telefónicos",
    "- Mensajería/WhatsApp",
    "- Email y comunicaciones",
    "- Web/App y reservas",
    "- Experiencia en tienda",
    "- Instalaciones y espera",
    "- Logística y envíos",
    "- Accesos y aparcamiento",
  ].join("\n");

  const user = [
    "Te doy una lista de conceptos {id,label}.",
    "Agrúpalos en formato JSON EXACTO:",
    "{",
    '  "topics": [',
    '    { "topic_label": "nombre del tema", "members": ["id1","id2","..."] }',
    "  ]",
    "}",
    "Políticas: sin adjetivos, sin inventar IDs, sin duplicar IDs, tamaño mínimo del grupo indicado.",
    "",
    "Datos:",
    JSON.stringify(items, null, 2),
  ].join("\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

/* ─────────────────────── Carga de conceptos ────────────────────── */

async function loadCandidateConcepts(params: {
  locationId?: string | null;
  companyId?: string | null;
  recencyDays?: number;
  limit?: number;
}): Promise<ConceptRow[]> {
  const recencyDays = Math.max(1, Math.min(3650, params.recencyDays ?? 365));
  const limit = Math.max(1, Math.min(2000, params.limit ?? 500));

  const sql = `
    SELECT c.id::text, c.label, c.rating, c.topic_id
    FROM concept c
    JOIN "Review" r ON r.id = c.review_id
    LEFT JOIN topic t ON t.id = c.topic_id
    WHERE
      COALESCE(r."createdAtG", r."ingestedAt") >= (now() - make_interval(days => $1::int))
      AND ($2::text IS NULL OR r."locationId" = $2::text)
      AND ($3::text IS NULL OR r."companyId"  = $3::text)
      AND (c.topic_id IS NULL OR COALESCE(t.is_stable, false) = false)
    ORDER BY c.updated_at DESC NULLS LAST
    LIMIT $4::int
  `;

  const rows = await prisma.$queryRawUnsafe<ConceptRow[]>(
    sql,
    recencyDays,
    params.locationId ?? null,
    params.companyId ?? null,
    limit
  );

  return rows;
}

/* ──────────────── Util: descripción 30–70 caracteres ───────────── */

function buildTopicDescription(topic: CleanedTopic, byId: Map<string, ConceptRow>): string {
  const phrases: string[] = [];
  for (const id of topic.members) {
    const lbl = (byId.get(id)?.label || "").replace(/\.$/, "").trim();
    if (!lbl) continue;
    const lower = lbl.toLowerCase();
    if (!phrases.some((p) => p.toLowerCase() === lower)) phrases.push(lbl);
  }

  let desc = "";
  for (const p of phrases) {
    const candidate = desc ? `${desc}; ${p}` : p;
    if (candidate.length <= 68) desc = candidate;
    else break;
  }

  if (desc.length < 30) {
    desc = `${topic.label}: ${topic.members.length} conceptos relacionados`;
  }

  if (desc.length > 70) {
    desc = desc.slice(0, 70);
    desc = desc.replace(/\s+\S*$/, "") + "…";
  }

  return desc;
}

/* ────────────────────────── PERSISTENCIA ───────────────────────── */

export async function llmGroupConcepts(opts?: {
  locationId?: string | null;
  companyId?: string | null;
  recencyDays?: number;
  limit?: number;
  includeAssigned?: boolean;
  minTopicSize?: number;
  dryRun?: boolean;
}) {
  const minTopicSize = Math.max(2, Math.min(10, opts?.minTopicSize ?? 2));
  const dryRun = opts?.dryRun !== false ? true : false;

  const concepts = await loadCandidateConcepts({
    locationId: opts?.locationId ?? null,
    companyId: opts?.companyId ?? null,
    recencyDays: opts?.recencyDays ?? 365,
    limit: opts?.limit ?? 500,
  });

  if (concepts.length === 0) {
    return {
      ok: true,
      taken: 0,
      createdTopics: 0,
      assignedConcepts: 0,
      preview: { topics: [] as any[] },
      note: "No hay conceptos pendientes en este alcance.",
    };
  }

  const items: ConceptLite[] = concepts.map((c) => ({ id: c.id, label: c.label }));
  const messages = buildMessagesForClustering(items, minTopicSize);

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages,
  });

  let json: LLMTopicsResponse | null = null;
  try {
    const raw = resp.choices?.[0]?.message?.content ?? "{}";
    json = JSON.parse(raw) as LLMTopicsResponse;
  } catch {
    return { ok: false, error: "La IA no devolvió JSON válido para el clustering." };
  }

  if (!json?.topics || !Array.isArray(json.topics)) {
    return { ok: false, error: "Respuesta JSON sin 'topics' válido.", preview: json };
  }

  const conceptSet = new Set<string>(concepts.map((c) => c.id));
  const seen = new Set<string>();

  const cleaned: CleanedTopic[] = json.topics
    .map((t) => {
      const rawLabel = String((t.topic_label ?? t.label ?? "").toString().trim()).slice(0, 120);
      const label = rawLabel && rawLabel.length >= 3 ? rawLabel : "Tema sin título";

      const validMembers: string[] = (t.members ?? [])
        .filter((id) => conceptSet.has(id))
        .filter((id) => {
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

      return {
        label,
        description: t.description ? String(t.description).slice(0, 240) : null,
        members: validMembers,
      };
    })
    .filter((t) => t.members.length >= minTopicSize)
    .sort((a, b) => b.members.length - a.members.length);

  if (cleaned.length === 0) {
    return {
      ok: true,
      taken: concepts.length,
      createdTopics: 0,
      assignedConcepts: 0,
      preview: { topics: [] as any[] },
      note: `El LLM generó agrupaciones < ${minTopicSize} miembros; descartadas por política.`,
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
      note: "dryRun=true (no se escribió nada).",
    };
  }

  const byId = new Map<string, ConceptRow>(concepts.map((c) => [c.id, c]));
  let created = 0;
  let assigned = 0;
  const createdTopicIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const topic of cleaned) {
      const ratings = topic.members
        .map((id) => byId.get(id)?.rating)
        .filter((n): n is number => typeof n === "number");

      const avgRaw =
        ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
      const avgRounded = avgRaw !== null ? Math.round(avgRaw * 100) / 100 : null;

      const autoDesc = buildTopicDescription(topic, byId);

      const createdTopic = await tx.topic.create({
        data: {
          label: topic.label,
          description: autoDesc, // se sobrescribe después
          model: "gpt-4o-mini",
          concept_count: topic.members.length,
          avg_rating: avgRounded,
          is_stable: topic.members.length > 3,
        },
        select: { id: true },
      });

      await tx.concept.updateMany({
        where: { id: { in: topic.members } },
        data: { topic_id: createdTopic.id, updated_at: new Date() },
      });

      created += 1;
      assigned += topic.members.length;
      createdTopicIds.push(createdTopic.id);
    }
  });

  // 👇 Generar descripciones IA completas para todos los topics creados
  await Promise.all(createdTopicIds.map((id) => generateAndStoreTopicDescription(id)));

  return {
    ok: true,
    taken: concepts.length,
    createdTopics: created,
    assignedConcepts: assigned,
    preview: { topics: cleaned },
  };
}
