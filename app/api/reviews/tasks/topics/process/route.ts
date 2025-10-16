import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const recencyDays = Math.max(1, Number(searchParams.get("recencyDays") ?? 180));
    const limit = Math.max(1, Math.min(2000, Number(searchParams.get("limit") ?? 500)));

    if (!locationId) {
      return NextResponse.json({ ok: false, error: "locationId requerido" }, { status: 400 });
    }

    // 1) Traer conceptos candidatos: sin topic o con topic inestable, en la ubicación y ventana de tiempo
    const concepts = await prisma.$queryRaw<
      { id: string; label: string; rating: number | null; topic_id: string | null }[]
    >`
      SELECT c.id::text, c.label, c.rating, c.topic_id
      FROM concept c
      JOIN "Review" r ON r.id = c.review_id
      LEFT JOIN topic t ON t.id = c.topic_id
      WHERE r."locationId" = ${locationId}
        AND COALESCE(r."createdAtG", r."ingestedAt") >= now() - (${recencyDays}::int || ' days')::interval
        AND (c.topic_id IS NULL OR COALESCE(t.is_stable, false) = false)
      ORDER BY c.updated_at DESC NULLS LAST
      LIMIT ${limit}
    `;

    if (concepts.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, createdTopics: 0, linked: 0 });
    }

    // 2) Cargar topics existentes (map por label en minúsculas)
    const existingTopics = await prisma.$queryRaw<
      { id: string; label: string; is_stable: boolean | null }[]
    >`
      SELECT t.id::text, t.label, t.is_stable
      FROM topic t
    `;

    const byLabel = new Map<string, { id: string; stable: boolean }>();
    for (const t of existingTopics) {
      if (!t?.label) continue;
      byLabel.set(t.label.toLowerCase(), { id: t.id, stable: !!t.is_stable });
    }

    // 3) Upsert por label (no modificamos campos del topic si es estable; solo enlazamos conceptos)
    let createdTopics = 0;
    let linked = 0;

    for (const c of concepts) {
      const key = c.label.trim().toLowerCase();
      let topicId = byLabel.get(key)?.id ?? null;
      const topicStable = byLabel.get(key)?.stable ?? false;

      // Si existe topic con ese label: asignar concept y seguir (aunque sea estable, no cambiamos el topic)
      if (topicId) {
        await prisma.concept.update({ where: { id: c.id }, data: { topic_id: topicId } });
        linked++;
        continue;
      }

      // Si no existe: crear topic borrador (inestable) con ese label
      const created = await prisma.topic.create({
        data: {
          label: c.label,
          is_stable: false,
          // created_at / updated_at tienen defaults; no hace falta setearlos
        },
        select: { id: true },
      });

      topicId = created.id;
      byLabel.set(key, { id: topicId, stable: false });
      createdTopics++;

      // Enlazar el concepto al topic recién creado
      await prisma.concept.update({ where: { id: c.id }, data: { topic_id: topicId } });
      linked++;
    }

    // 4) Recalcular métricas básicas en topics afectados
    await prisma.$executeRawUnsafe(`
      UPDATE topic t SET
        concept_count = sub.cnt,
        avg_rating = sub.avg
      FROM (
        SELECT c.topic_id, COUNT(*)::int AS cnt, AVG(c.rating)::float AS avg
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
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}

export const revalidate = 0;
