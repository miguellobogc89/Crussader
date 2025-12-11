import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const revalidate = 0;

// 🔧 Normaliza un label para agrupar variantes mínimas
function normalizeTopicLabel(label: string | null | undefined): string {
  if (!label) return "";
  return label
    .normalize("NFD") // separa tildes
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ\s]/gi, " ") // limpia signos raros
    .replace(/\s+/g, " ") // colapsa espacios
    .trim();
}

// 🔧 Construye una clave compacta para el topic
// Usamos las primeras 5 palabras del label normalizado.
function buildTopicKey(normalizedLabel: string): string {
  const words = normalizedLabel.split(" ").filter(Boolean);
  if (words.length <= 5) return normalizedLabel;
  return words.slice(0, 5).join(" ");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    // 👇 Solo aplicamos recency si VIENE en el querystring
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

    // 1) Conceptos candidatos
    //    Si hay recencyDays en el query: filtramos por fecha.
    //    Si no, usamos TODAS las reseñas de esa location.
    let concepts: { id: string; label: string; rating: number | null; topic_id: string | null }[];

    if (hasRecencyFilter) {
      concepts = await prisma.$queryRaw<
        { id: string; label: string; rating: number | null; topic_id: string | null }[]
      >`
        SELECT c.id::text, c.label, c.rating, c.topic_id
        FROM concept c
        JOIN "Review" r ON r.id = c.review_id
        LEFT JOIN topic t ON t.id = c.topic_id
        WHERE r."locationId" = ${locationId}
          AND COALESCE(r."createdAtG", r."ingestedAt")
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
        JOIN "Review" r ON r.id = c.review_id
        LEFT JOIN topic t ON t.id = c.topic_id
        WHERE r."locationId" = ${locationId}
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

    // 2) Cargar topics existentes y mapearlos por clave normalizada
    const existingTopics = await prisma.$queryRaw<
      { id: string; label: string; is_stable: boolean | null }[]
    >`
      SELECT t.id::text, t.label, t.is_stable
      FROM topic t
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

    // 3) Upsert por clave normalizada
    let createdTopics = 0;
    let linked = 0;

    for (const c of concepts) {
      const norm = normalizeTopicLabel(c.label);
      if (!norm) continue;

      const key = buildTopicKey(norm);
      if (!key) continue;

      const entry = byKey.get(key);
      let topicId = entry?.id ?? null;
      const topicStable = entry?.stable ?? false;

      if (topicId) {
        // topic existente → solo enlazamos concept
        await prisma.concept.update({
          where: { id: c.id },
          data: { topic_id: topicId },
        });
        linked++;
        continue;
      }

      // Nuevo topic inestable con el label del concept
      const created = await prisma.topic.create({
        data: {
          label: c.label,
          is_stable: false,
        },
        select: { id: true },
      });

      topicId = created.id;
      byKey.set(key, { id: topicId, stable: false });
      createdTopics++;

      await prisma.concept.update({
        where: { id: c.id },
        data: { topic_id: topicId },
      });
      linked++;
    }

    // 4) Recalcular métricas básicas
    await prisma.$executeRawUnsafe(`
      UPDATE topic t SET
        concept_count = sub.cnt,
        avg_rating   = sub.avg
      FROM (
        SELECT c.topic_id,
               COUNT(*)::int        AS cnt,
               AVG(c.rating)::float AS avg
        FROM concept c
        WHERE c.topic_id IS NOT NULL
        GROUP BY c.topic_id
      ) sub
      WHERE t.id = sub.topic_id
    `);

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
