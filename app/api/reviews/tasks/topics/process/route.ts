// app/api/reviews/tasks/topics/process/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const revalidate = 0;

// 🔧 Normaliza un label para agrupar variantes mínimas
function normalizeTopicLabel(label: string | null | undefined): string {
  if (!label) return "";
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 🔧 Construye una clave compacta para el topic (primeras 5 palabras)
function buildTopicKey(normalizedLabel: string): string {
  const words = normalizedLabel.split(" ").filter(Boolean);
  if (words.length <= 5) return normalizedLabel;
  return words.slice(0, 5).join(" ");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = (searchParams.get("locationId") ?? "").trim();

    const recencyParam = searchParams.get("recencyDays");
    const hasRecencyFilter = recencyParam !== null;
    const recencyDays = hasRecencyFilter
      ? Math.max(1, Number(recencyParam || "180"))
      : 0;

    const limit = Math.max(
      1,
      Math.min(2000, Number(searchParams.get("limit") ?? 500)),
    );

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId requerido" },
        { status: 400 },
      );
    }

    // 1) Conceptos candidatos (YA usamos concept.location_id)
    //    Si hay recencyDays: filtramos por concept.review_date (que ya guardas).
    //    Además evitamos re-linkear a topics estables.
    let concepts: {
      id: string;
      label: string;
      rating: number | null;
      topic_id: string | null;
    }[];

    if (hasRecencyFilter) {
      concepts = await prisma.$queryRaw<
        { id: string; label: string; rating: number | null; topic_id: string | null }[]
      >`
        SELECT c.id::text, c.label, c.rating, c.topic_id
        FROM concept c
        LEFT JOIN topic t ON t.id = c.topic_id
        WHERE c.location_id = ${locationId}
          AND COALESCE(c.review_date, c.created_at)
              >= now() - (${recencyDays}::int || ' days')::interval
          AND (c.topic_id IS NULL OR COALESCE(t.is_stable, false) = false)
        ORDER BY c.updated_at DESC NULLS LAST
        LIMIT ${limit}
      `;
    } else {
      concepts = await prisma.$queryRaw<
        { id: string; label: string; rating: number | null; topic_id: string | null }[]
      >`
        SELECT c.id::text, c.label, c.rating, c.topic_id
        FROM concept c
        LEFT JOIN topic t ON t.id = c.topic_id
        WHERE c.location_id = ${locationId}
          AND (c.topic_id IS NULL OR COALESCE(t.is_stable, false) = false)
        ORDER BY c.updated_at DESC NULLS LAST
        LIMIT ${limit}
      `;
    }

    if (concepts.length === 0) {
      return NextResponse.json({
        ok: true,
        locationId,
        processed: 0,
        createdTopics: 0,
        linked: 0,
      });
    }

    // 2) Cargar SOLO topics de esa location (clave: no mezclar ubicaciones)
    const existingTopics = await prisma.$queryRaw<
      { id: string; label: string; is_stable: boolean | null }[]
    >`
      SELECT t.id::text, t.label, t.is_stable
      FROM topic t
      WHERE t.location_id = ${locationId}
    `;

    const byKey = new Map<string, { id: string; stable: boolean }>();

    for (const t of existingTopics) {
      if (!t?.label) continue;
      const norm = normalizeTopicLabel(t.label);
      if (!norm) continue;
      const key = buildTopicKey(norm);
      if (!key) continue;

      if (!byKey.has(key)) {
        byKey.set(key, { id: t.id, stable: !!t.is_stable });
      }
    }

    // 3) Crear / enlazar por clave normalizada (scope: location)
    let createdTopics = 0;
    let linked = 0;

    for (const c of concepts) {
      const norm = normalizeTopicLabel(c.label);
      if (!norm) continue;

      const key = buildTopicKey(norm);
      if (!key) continue;

      const entry = byKey.get(key);
      let topicId = entry?.id ?? null;

      if (topicId) {
        await prisma.concept.update({
          where: { id: c.id },
          data: { topic_id: topicId },
        });
        linked++;
        continue;
      }

// 1) Intentar reutilizar si ya existe (por label exacto en esta location)
const existing = await prisma.topic.findFirst({
  where: {
    location_id: locationId,
    label: c.label,
  },
  select: { id: true },
});

let newTopicId = existing?.id ?? null;

if (!newTopicId) {
  const created = await prisma.topic.create({
    data: {
      label: c.label,
      is_stable: false,
      location_id: locationId,
    },
    select: { id: true },
  });

  newTopicId = created.id;
  createdTopics++;
}

byKey.set(key, { id: newTopicId, stable: false });

await prisma.concept.update({
  where: { id: c.id },
  data: { topic_id: newTopicId },
});
linked++;

    }

    // 4) Recalcular métricas SOLO para topics de esta location
    await prisma.$executeRaw`
      UPDATE topic t SET
        concept_count = sub.cnt,
        avg_rating   = sub.avg
      FROM (
        SELECT c.topic_id,
               COUNT(*)::int        AS cnt,
               AVG(c.rating)::float AS avg
        FROM concept c
        WHERE c.topic_id IS NOT NULL
          AND c.location_id = ${locationId}
        GROUP BY c.topic_id
      ) sub
      WHERE t.id = sub.topic_id
        AND t.location_id = ${locationId}
    `;

    return NextResponse.json({
      ok: true,
      locationId,
      processed: concepts.length,
      createdTopics,
      linked,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "error" },
      { status: 500 },
    );
  }
}
