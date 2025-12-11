// app/server/concepts/processBatch.ts
// ======================================================
// Extrae conceptos desde reseñas pendientes (sin concept)
// y marca cada review como conceptualizada al finalizar.
// ======================================================

import { prisma } from "@/app/server/db";
import { extractConceptsFromReview } from "../../server/concepts/extractConcepts";

type RawReview = {
  id: string;
  comment: string | null;
  rating: number | null;
  createdAtG: string | null;
  ingestedAt: string;
};

function normalizeRating(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(5, Math.round(n)));
}

/** Cuenta reviews sin conceptualizar */
export async function countPendingForLocation(locationId: string) {
  const [row] = await prisma.$queryRaw<{ n: string }[]>`
    SELECT COUNT(*)::text AS n
    FROM "Review"
    WHERE "locationId" = ${locationId}
      AND COALESCE(is_conceptualized, false) = false
  `;
  return Number(row?.n ?? "0");
}

/** Procesa un batch de reviews pendientes de conceptualización */
export async function processUnconceptualizedForLocation(locationId: string, limit = 50) {
  const reviews = await prisma.$queryRaw<RawReview[]>`
    SELECT
      id::text,
      comment,
      rating,
      "createdAtG"::text AS "createdAtG",
      "ingestedAt"::text AS "ingestedAt"
    FROM "Review"
    WHERE "locationId" = ${locationId}
      AND COALESCE(is_conceptualized, false) = false
    ORDER BY "createdAtG" NULLS LAST, "ingestedAt" ASC
    LIMIT ${limit}
  `;

  if (reviews.length === 0)
    return { processed: 0, insertedConcepts: 0, emptyText: 0 };

  let insertedConcepts = 0;
  let emptyText = 0;

  for (const r of reviews) {
    const text = (r.comment ?? "").trim();

    // 🔹 Si no hay texto → marcar conceptualizada y seguir
    if (!text) {
      await prisma.review.update({
        where: { id: r.id },
        data: { is_conceptualized: true, updatedAt: new Date() },
      });
      emptyText++;
      continue;
    }

    // 🔹 Extraer conceptos (0..6)
    const extracted = await extractConceptsFromReview(text);
    if (!extracted || extracted.length === 0) {
      await prisma.review.update({
        where: { id: r.id },
        data: { is_conceptualized: true, updatedAt: new Date() },
      });
      continue;
    }

    const reviewDateISO = (r.createdAtG ?? r.ingestedAt) || null;
    const rating = normalizeRating(r.rating);

    // 🔹 Insertar 1 concept por ítem extraído
    for (const item of extracted) {
      if (!item?.label) continue;

      await prisma.concept.create({
        data: {
          label: item.label,
          model: "gpt-4o-mini",
          review_id: r.id,
          sentiment: item.sentiment ?? null,
          confidence:
            typeof item.confidence === "number" ? item.confidence : null,
          relevance: 1,
          rating: rating ?? undefined,
          review_date: reviewDateISO ? new Date(reviewDateISO) : undefined,
        },
      });

      insertedConcepts++;
    }

    // 🔹 Marcar la review como conceptualizada
    await prisma.review.update({
      where: { id: r.id },
      data: { is_conceptualized: true, updatedAt: new Date() },
    });
  }

  return { processed: reviews.length, insertedConcepts, emptyText };
}

export { processUnconceptualizedForLocation as processUnconceptualizedBatch };
