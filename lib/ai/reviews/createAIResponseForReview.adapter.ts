// lib/ai/reviews/createAIResponseForReview.adapter.ts
import type { Prisma } from "@prisma/client";
import { createAIResponseForReview as runCore } from "@/lib/ai/reviews/createAIResponseForReview";

type AnyDict = Record<string, any>;

/**
 * Acepta formas flexibles:
 *  - { reviewId }
 *  - { review: { id } }
 *  - { id }  (legacy)
 *  + opcionalmente: mode, previousContent, previousResponseId
 */
export async function createAIResponseForReview(
  input: AnyDict
): Promise<Prisma.ResponseGetPayload<any>> {
  const reviewId: string | undefined =
    input?.reviewId ?? input?.review?.id ?? input?.id;

  if (!reviewId) {
    throw new Error("reviewId_required");
  }

  const saved = await runCore({
    reviewId,
    mode: input.mode,
    previousContent: input.previousContent,
    previousResponseId: input.previousResponseId,
  });

  return saved;
}
