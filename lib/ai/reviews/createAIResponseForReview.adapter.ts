// lib/ai/reviews/createAIResponseForReview.adapter.ts
// Adapter mínimo: delega en la implementación estable que ya persiste en Prisma.
// Mantiene compatibilidad con las rutas actuales que esperan la FILA de Response.

import type { Prisma } from "@prisma/client";
import { createAIResponseForReview as runCore } from "@/lib/ai/reviews/createAIResponseForReview";

type AnyDict = Record<string, any>;

/**
 * Acepta formas flexibles:
 *  - { reviewId }
 *  - { review: { id } }
 *  - { id }  (legacy)
 * Ignora el resto de campos; la lógica/ajustes se resuelven dentro de runCore().
 * Devuelve: la fila Prisma Response creada.
 */
export async function createAIResponseForReview(input: AnyDict): Promise<Prisma.ResponseGetPayload<any>> {
  const reviewId: string | undefined =
    input?.reviewId ?? input?.review?.id ?? input?.id;

  if (!reviewId) {
    throw new Error("reviewId_required");
  }

  // Delegamos toda la generación + guardado en la función estable
  // lib/ai/reviews/createAIResponseForReview.ts
  const saved = await runCore(reviewId);

  // Las rutas usan este adapter y esperan la fila ya creada
  return saved;
}
