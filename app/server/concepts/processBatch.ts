// app/server/concepts/processBatch.ts
import { prisma } from "@/app/server/db";
import { embedTexts, toPgVectorLiteral } from "../embeddings";
import { extractConceptsFromReview } from "./extractConcepts";

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

/** Cuenta reviews de una ubicación pendientes de conceptualizar */
export async function countPendingForLocation(locationId: string) {
  const [row] = await prisma.$queryRaw<{ n: string }[]>`
    SELECT COUNT(*)::text AS n
    FROM "Review"
    WHERE "locationId" = ${locationId}
      AND COALESCE(is_conceptualized, false) = false
  `;
  return Number(row?.n ?? "0");
}

/** Procesa un batch de reviews pendientes para una ubicación concreta */
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

  if (reviews.length === 0) return { processed: 0, insertedConcepts: 0, emptyText: 0 };

  let insertedConcepts = 0;
  let emptyText = 0;

  for (const r of reviews) {
    const text = (r.comment ?? "").trim();

    // Si no hay texto, marcar como conceptualizada y seguir
    if (!text) {
      await prisma.$executeRaw`
        UPDATE "Review" SET is_conceptualized = true, "updatedAt" = now()
        WHERE id = ${r.id}
      `;
      emptyText++;
      continue;
    }

    // Extraer conceptos (0..6)
    const extracted = await extractConceptsFromReview(text);
    if (!extracted || extracted.length === 0) {
      await prisma.$executeRaw`
        UPDATE "Review" SET is_conceptualized = true, "updatedAt" = now()
        WHERE id = ${r.id}
      `;
      continue;
    }

    // Embeddings de labels
    const labels = extracted.map((c) => c.label);
    const vectors = await embedTexts(labels).catch(() => [] as number[][]);

    const reviewDateISO = (r.createdAtG ?? r.ingestedAt) || null;
    const rating = normalizeRating(r.rating);

    // Insertar 1 concept por ítem
    for (let i = 0; i < extracted.length; i++) {
      const item = extracted[i];
      const vec = vectors[i];
      if (!item?.label || !vec) continue;

      const centroidLit = toPgVectorLiteral(vec);

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO concept (
          id, label, model, centroid,
          sentiment, confidence, relevance,
          rating, review_date, review_id,
          created_at, updated_at
        )
        VALUES (
          gen_random_uuid(),
          $1,
          'text-embedding-3-small',
          ${centroidLit},
          $2,
          $3::real,
          $4::real,
          $5::int,
          $6::timestamptz,
          $7::text,
          now(), now()
        )
        `,
        item.label,
        item.sentiment ?? null,
        typeof item.confidence === "number" ? item.confidence : null,
        1, // relevance por ahora
        rating,
        reviewDateISO,
        r.id
      );

      insertedConcepts++;
    }

    // Marcar la review como conceptualizada
    await prisma.$executeRaw`
      UPDATE "Review" SET is_conceptualized = true, "updatedAt" = now()
      WHERE id = ${r.id}
    `;
  }

  return { processed: reviews.length, insertedConcepts, emptyText };
}

export { processUnconceptualizedForLocation as processUnconceptualizedBatch };
