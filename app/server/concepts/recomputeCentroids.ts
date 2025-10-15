// app/server/concepts/recomputeCentroids.ts
// ==============================================
// 📌 Descripción:
// Recalcula concept.centroid a partir de la media de los embeddings
// de sus reviews vinculadas (review_concept → review_embedding).
// - Trabaja contra el modelo `review` (minúscula) y su tabla de embeddings.
// - Usa consulta SQL cruda para leer vector::text y parsearlo en number[].
// - Actualiza centroid con literal pgvector.
//
// Dependencias:
//  - prisma (app/server/db.ts)
//  - centroid() y toPgVectorLiteral() (app/server/embeddings.ts)
// ==============================================

import { prisma } from "../db";
import { centroid, toPgVectorLiteral } from "../embeddings";

/** Parsea el formato de texto de pgvector: '[0.1,0.2,...]' → number[] */
function parsePgVectorText(s: string): number[] {
  const trimmed = s.trim();
  const inside = trimmed.startsWith("[") && trimmed.endsWith("]")
    ? trimmed.slice(1, -1)
    : trimmed;
  if (!inside) return [];
  return inside.split(",").map((x) => parseFloat(x));
}

/**
 * Recalcula centroid para una lista de concepts (o para todos con vínculos).
 * @param conceptIds opcional; si se omite, procesa todos los concepts que tengan reviews vinculadas.
 * @returns resumen { updated, skipped }
 */
export async function recomputeConceptCentroids(conceptIds?: string[]) {
  // 1) Selecciona los concept a procesar
  const concepts = conceptIds && conceptIds.length > 0
    ? await prisma.concept.findMany({ where: { id: { in: conceptIds } }, select: { id: true } })
    : await prisma.$queryRaw<{ id: string }[]>`
        SELECT DISTINCT c.id
        FROM concept c
        JOIN review_concept rc ON rc.concept_id = c.id
      `;

  let updated = 0;
  let skipped = 0;

  for (const { id } of concepts) {
    // 2) Carga todos los embeddings de las reviews asociadas a este concept
    const rows = await prisma.$queryRaw<{ v: string }[]>`
      SELECT (re.vector)::text AS v
      FROM review_embedding re
      JOIN review_concept rc ON rc.review_id = re.review_id
      WHERE rc.concept_id = ${id}::uuid
    `;

    if (!rows.length) {
      skipped++;
      continue;
    }

    const vectors = rows.map((r) => parsePgVectorText(r.v)).filter((v) => v.length > 0);
    if (!vectors.length) {
      skipped++;
      continue;
    }

    // 3) Media (centroid) y actualización
    const center = centroid(vectors);
    const literal = toPgVectorLiteral(center);

    // Nota: usamos $executeRawUnsafe para inyectar el literal ::vector
    await prisma.$executeRawUnsafe(
      `UPDATE concept SET centroid = ${literal}, updated_at = now() WHERE id = $1::uuid`,
      id
    );

    updated++;
  }

  return { updated, skipped };
}
