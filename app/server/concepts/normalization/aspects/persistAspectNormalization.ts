// app/server/concepts/normalization/persistAspectNormalization.ts
import { prisma } from "@/app/server/db";
import type { NormalizeAspectResult } from "./normalizeAspect";
import { canonicalizeKey } from "../canonicalizeKey";

const NORMALIZATION_VERSION = "v1";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function persistAspectNormalization(
  conceptId: string,
  originalAspect: string,
  originalEntity: string | null,
  result: NormalizeAspectResult,
) {
  if (!isUuid(conceptId)) {
    throw new Error(`[persistAspectNormalization] conceptId is not UUID: ${conceptId}`);
  }

  await prisma.$transaction(async (tx) => {
    let normalizedAspectId: string;

    if (result.action === "match") {
      normalizedAspectId = result.normalized_aspect_id;

      if (!isUuid(normalizedAspectId)) {
        throw new Error(
          `[persistAspectNormalization] normalizeAspect returned non-UUID normalized_aspect_id="${normalizedAspectId}". Result=${JSON.stringify(result)}`
        );
      }

      await tx.concept_normalized_aspect.createMany({
        data: [
          {
            concept_id: conceptId,
            normalized_aspect_id: normalizedAspectId,
            matched_by: "ai",
            match_confidence: result.confidence,
            original_aspect: originalAspect,
            original_entity: originalEntity,
          },
        ],
        skipDuplicates: true,
      });

      await tx.normalized_aspect.update({
        where: { id: normalizedAspectId },
        data: {
          usage_count: { increment: 1 },
          is_active: true,
          updated_at: new Date(),
        },
      });
    } else {
      const canonicalKey = canonicalizeKey(result.display_name);

      const created = await tx.normalized_aspect.upsert({
        where: { canonical_key: canonicalKey },
        create: {
          canonical_key: canonicalKey,
          display_name: result.display_name,
          description: result.description,
          examples: result.examples,
          confidence: result.confidence,
          created_by: "ai",
          is_active: true,
          usage_count: 1,
        },
        update: {
          is_active: true,
          usage_count: { increment: 1 },
          updated_at: new Date(),
        },
      });

      normalizedAspectId = created.id;

      await tx.concept_normalized_aspect.createMany({
        data: [
          {
            concept_id: conceptId,
            normalized_aspect_id: normalizedAspectId,
            matched_by: "ai",
            match_confidence: result.confidence,
            original_aspect: originalAspect,
            original_entity: originalEntity,
          },
        ],
        skipDuplicates: true,
      });
    }

    await tx.concept.update({
      where: { id: conceptId },
      data: {
        normalized_aspect_id: normalizedAspectId,
        normalization_version: NORMALIZATION_VERSION,
      },
    });
  });
}
