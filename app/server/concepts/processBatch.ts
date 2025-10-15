// app/server/concepts/processBatch.ts
// ==============================================
// 📌 Descripción:
// Procesa reseñas pendientes en tabla "review_concept_input":
// 1) Lee N reseñas con is_conceptualized=false (SQL crudo).
// 2) Extrae conceptos con OpenAI.
// 3) Para cada concepto (label):
//    - Busca concept por label; si no existe, lo inserta con centroid = embedding(label).
// 4) ⚠️ En vez de escribir en review_concept, ACTUALIZA el concept directamente con:
//      relevance, assigned_at(now), rating, review_created_at, review_date, company_id, location_id.
//    (último vínculo sobrescribe → “last write wins”).
// 5) Marca la reseña como conceptualizada.
//
// 👉 Motivo de SQL crudo:
//    - centroid es Unsupported("vector") en Prisma.
//    - Libertad para escribir/actualizar columnas sin bloquear por client.
// ==============================================

import { prisma } from "../db";
import { embedTexts, toPgVectorLiteral } from "../embeddings";
import { extractConceptsFromReview } from "./extractConcepts";

type RawReview = {
  id: string;                 // uuid en BD
  text: string;
  date: string;               // ISO (review_concept_input.date)
  rating: number;             // Int (0..5)
  company_id: string | null;
  location_id: string | null;
};

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

/** Asegura un rating entero en rango 0..5 (o null si no es válido). */
function normalizeRating(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  // Ajusta el rango si tu escala es distinta
  const clamped = Math.max(0, Math.min(5, Math.round(n)));
  return clamped;
}

/** Busca concept.id por label (si existe) */
async function findConceptIdByLabel(label: string): Promise<string | null> {
  const row = await prisma.concept.findFirst({
    where: { label },
    select: { id: true },
  });
  return row?.id ?? null;
}

/** Crea concept con centroid (embedding del label) y devuelve id */
async function createConceptWithCentroid(label: string, centroidVec: number[]): Promise<string> {
  const centroidLit = toPgVectorLiteral(centroidVec);
  // Insert con SQL crudo porque centroid es Unsupported("vector")
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `
    INSERT INTO concept (label, model, centroid, created_at, updated_at)
    VALUES ($1, 'text-embedding-3-small', ${centroidLit}, now(), now())
    RETURNING id
    `,
    label
  );
  return rows[0].id;
}

// ───────────────────────────────────────────────────────────────────────────────
// Lote principal
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Procesa reseñas no conceptualizadas en una llamada manual (botón).
 * @param limit Máximo de reseñas a procesar.
 * @returns resumen { processed, newConcepts, linked }
 */
export async function processUnconceptualizedBatch(limit = 50) {
  // 1) Leer N reseñas pendientes desde tabla review_concept_input
  const reviews = await prisma.$queryRaw<RawReview[]>`
    SELECT id::text, text, date::text, rating, company_id, location_id
    FROM review_concept_input
    WHERE COALESCE(is_conceptualized, false) = false
    ORDER BY date ASC
    LIMIT ${limit}
  `;

  if (reviews.length === 0) return { processed: 0, newConcepts: 0, linked: 0 };

  let newConcepts = 0;
  let linked = 0;

  for (const r of reviews) {
    // 2) Extraer conceptos desde el texto de la review
    //    Puede devolver ['limpieza','precio'] o [{label:'limpieza', relevance:0.9}, ...]
    const rawConcepts = (await extractConceptsFromReview(r.text)) as any[];

    // Normalizamos: extraemos labels (string[]) y guardamos relevance por índice
    const labels = rawConcepts
      .map((c) => (typeof c === "string" ? c : c?.label))
      .filter(Boolean) as string[];

    if (labels.length === 0) {
      // 5) Marcar conceptualizada aunque no tenga conceptos
      await prisma.$executeRaw`
        UPDATE review_concept_input
        SET is_conceptualized = true, updated_at = now()
        WHERE id = ${r.id}::uuid
      `;
      continue;
    }

    // Pre-embed de labels (para crear centroid si hace falta)
    const labelVectors = await embedTexts(labels).catch(() => [] as number[][]);

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const relevance =
        typeof rawConcepts[i] === "object" && rawConcepts[i] !== null && "relevance" in rawConcepts[i]
          ? Number(rawConcepts[i].relevance) || 1
          : 1;

      // 3a) buscar concept por label
      let conceptId = await findConceptIdByLabel(label);

      // 3b) si no existe: crearlo con centroid = embedding(label)
      if (!conceptId) {
        const vec = labelVectors[i];
        if (!vec) continue; // si falló el embedding, saltamos este concepto
        conceptId = await createConceptWithCentroid(label, vec);
        newConcepts++;
      }

      // 4) Actualizar el concept con el contexto de ESTA review
      //    (última review sobrescribe: "last write wins")
      const normalizedRating = normalizeRating(r.rating);
      const reviewCreatedAtISO = r.date ?? null; // rci.date
      const reviewDateISO = r.date ?? null;

      await prisma.$executeRawUnsafe(
        `
        UPDATE concept
        SET
          relevance          = $2::real,
          assigned_at        = now(),
          rating             = $3::int,
          review_created_at  = $4::timestamptz,
          review_date        = $5::timestamptz,
          company_id         = $6::text,
          location_id        = $7::text,
          updated_at         = now()
        WHERE id = $1::uuid
        `,
        conceptId,              // $1
        relevance,              // $2
        normalizedRating,       // $3
        reviewCreatedAtISO,     // $4
        reviewDateISO,          // $5
        r.company_id ?? null,   // $6
        r.location_id ?? null   // $7
      );

      linked++;
    }

    // 5) Marcar la reseña como conceptualizada
    await prisma.$executeRaw`
      UPDATE review_concept_input
      SET is_conceptualized = true, updated_at = now()
      WHERE id = ${r.id}::uuid
    `;
  }

  return { processed: reviews.length, newConcepts, linked };
}
