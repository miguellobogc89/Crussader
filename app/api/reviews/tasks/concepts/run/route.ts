// app/api/reviews/tasks/concepts/run/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/server/db";

import {
  extractConceptsFromReview,
  type ExtractedConcept,
} from "@/app/server/concepts/extractConcepts";

import { normalizeEntity } from "@/app/server/concepts/normalization/entity/normalizeEntity";
import { persistEntityNormalization } from "@/app/server/concepts/normalization/entity/persistEntityNormalization";

import { normalizeAspectWithAI } from "@/app/server/concepts/normalization/aspects/normalizeAspect";
import { persistAspectNormalization } from "@/app/server/concepts/normalization/aspects/persistAspectNormalization";

export const runtime = "nodejs";

type RunResult = {
  ok: true;
  scope: "location" | "global";
  locationId: string | null;

  extracted_reviews: number;
  inserted_concepts: number;

  normalized_entities: number;
  normalized_aspects: number;
};

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  const i = Math.floor(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

async function extractBatchForLocation(locationId: string, limit: number) {
  // Contexto del negocio (igual que en /process)
  const loc = await prisma.location.findUnique({
    where: { id: locationId },
    select: {
      title: true,
      type: {
        select: {
          name: true,
          activity: { select: { name: true } },
        },
      },
    },
  });

  const businessName = loc?.title ?? null;
  const businessType = loc?.type?.name ?? null;
  const activityName = loc?.type?.activity?.name ?? null;

  const reviews = await prisma.$queryRaw<
    {
      id: string;
      comment: string | null;
      rating: number | null;
      createdAtG: Date | null;
      ingestedAt: Date;
    }[]
  >`
    SELECT r.id::text, r.comment, r.rating, r."createdAtG", r."ingestedAt"
    FROM "Review" r
    WHERE r."locationId" = ${locationId}
      AND COALESCE(r."isTest", false) = false
      AND COALESCE(r.is_conceptualized, false) = false
      AND COALESCE(NULLIF(TRIM(r.comment), ''), NULL) IS NOT NULL
    ORDER BY r."createdAtG" NULLS LAST, r."ingestedAt" ASC
    LIMIT ${limit}
  `;

  if (reviews.length === 0) {
    return { processed: 0, insertedConcepts: 0 };
  }

  let insertedConcepts = 0;

  for (const r of reviews) {
    try {
      const text = (r.comment ?? "").trim();
      if (!text) continue;

      const concepts = await extractConceptsFromReview(text, {
        businessName,
        businessType,
        activityName,
      });

      if (concepts && concepts.length > 0) {
        const reviewDate = (r.createdAtG ?? r.ingestedAt) ?? null;

        const reviewPublishedAt = r.createdAtG ?? r.ingestedAt;
        const reviewPublishedYear = reviewPublishedAt
          ? reviewPublishedAt.getUTCFullYear()
          : null;
        const reviewPublishedMonth = reviewPublishedAt
          ? reviewPublishedAt.getUTCMonth() + 1
          : null;

        const rating = Number.isFinite(r.rating)
          ? Math.max(0, Math.min(5, Math.round(r.rating as number)))
          : null;

        const batchData = concepts.map((c: ExtractedConcept) => ({
          label: c.summary,
          model: "gpt-4o-mini",
          review_id: r.id,
          sentiment: c.judgment,
          confidence:
            typeof c.intensity === "number"
              ? c.intensity
              : typeof (c as any).confidence === "number"
                ? (c as any).confidence
                : null,
          relevance: 1,
          rating,
          review_date: reviewDate,
          location_id: locationId,
          review_text: text,

          review_published_at: reviewPublishedAt,
          review_published_year: reviewPublishedYear,
          review_published_month: reviewPublishedMonth,

          structured: {
            entity: c.entity,
            aspect: c.aspect,
            judgment: c.judgment,
            intensity: c.intensity,
            descriptor: c.descriptor ?? null,
            summary: c.summary,
          },
        }));

        const res = await prisma.concept.createMany({ data: batchData });
        insertedConcepts += res.count;
      }
    } catch (err) {
      console.error("[concepts/run] error processing review", r.id, err);
    } finally {
      await prisma.$executeRaw`
        UPDATE "Review"
        SET is_conceptualized = true, "updatedAt" = now()
        WHERE id = ${r.id}
      `;
    }
  }

  return { processed: reviews.length, insertedConcepts };
}

async function normalizeEntityBatch(locationId: string, limit: number) {
  const where: any = {
    structured: { not: Prisma.JsonNull },
    normalized_entity_id: null,
    location_id: locationId,
  };

  const pending = await prisma.concept.findMany({
    where,
    select: { id: true, structured: true },
    orderBy: { created_at: "asc" },
    take: limit,
  });

  if (pending.length === 0) return 0;

  const candidates = await prisma.normalized_entity.findMany({
    where: { is_active: true },
    select: { id: true, display_name: true, canonical_key: true },
    orderBy: { usage_count: "desc" },
    take: 60,
  });

  let processed = 0;

  for (const c of pending) {
    const s = (c.structured as any) ?? {};
    const entity = String(s.entity ?? "").trim();

    let aspect: string | null = null;
    if (s.aspect) aspect = String(s.aspect).trim();

    if (!entity) continue;

    const result = await normalizeEntity({ entity, aspect, candidates });

    if (result.action === "create") {
      if (!result.canonical_key || !result.display_name) continue;
    }

    await persistEntityNormalization(c.id, entity, aspect, result);
    processed += 1;
  }

  return processed;
}

async function normalizeAspectBatch(locationId: string, limit: number) {
  const existingAspects = await prisma.normalized_aspect.findMany({
    where: { is_active: true },
    select: {
      id: true,
      canonical_key: true,
      display_name: true,
      description: true,
      examples: true,
    },
    orderBy: { usage_count: "desc" },
  });

  const where: any = { normalized_aspect_id: null, location_id: locationId };

  const concepts = await prisma.concept.findMany({
    where,
    select: { id: true, structured: true },
    take: limit,
    orderBy: { created_at: "asc" },
  });

  let processed = 0;

  for (const c of concepts) {
    const st = c.structured as any | null;
    if (!st || typeof st !== "object") continue;

    const aspect = typeof st.aspect === "string" ? st.aspect.trim() : "";
    if (!aspect) continue;

    const entity = typeof st.entity === "string" ? st.entity.trim() : null;
    const descriptor =
      typeof st.descriptor === "string" ? st.descriptor.trim() : null;

    const result = await normalizeAspectWithAI(
      { aspect, entity, descriptor },
      existingAspects,
    );

    await persistAspectNormalization(c.id, aspect, entity, result);
    processed += 1;
  }

  return processed;
}

async function runForLocation(locationId: string, opts: {
  conceptLimit: number;
  normalizeEntityLimit: number;
  normalizeAspectLimit: number;
  maxConceptBatches: number;
  maxEntityBatches: number;
  maxAspectBatches: number;
}) {
  let extracted_reviews = 0;
  let inserted_concepts = 0;
  let normalized_entities = 0;
  let normalized_aspects = 0;

  for (let i = 0; i < opts.maxConceptBatches; i++) {
    const r = await extractBatchForLocation(locationId, opts.conceptLimit);
    extracted_reviews += r.processed;
    inserted_concepts += r.insertedConcepts;
    if (r.processed === 0) break;
  }

  for (let i = 0; i < opts.maxEntityBatches; i++) {
    const p = await normalizeEntityBatch(locationId, opts.normalizeEntityLimit);
    normalized_entities += p;
    if (p === 0) break;
  }

  for (let i = 0; i < opts.maxAspectBatches; i++) {
    const p = await normalizeAspectBatch(locationId, opts.normalizeAspectLimit);
    normalized_aspects += p;
    if (p === 0) break;
  }

  return {
    extracted_reviews,
    inserted_concepts,
    normalized_entities,
    normalized_aspects,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const locationId = url.searchParams.get("locationId");

    const conceptLimit = clampInt(url.searchParams.get("conceptLimit"), 200, 10, 200);
    const normalizeEntityLimit = clampInt(url.searchParams.get("entityLimit"), 50, 10, 200);
    const normalizeAspectLimit = clampInt(url.searchParams.get("aspectLimit"), 200, 10, 500);

    const maxConceptBatches = clampInt(url.searchParams.get("maxConceptBatches"), 10, 1, 50);
    const maxEntityBatches = clampInt(url.searchParams.get("maxEntityBatches"), 10, 1, 50);
    const maxAspectBatches = clampInt(url.searchParams.get("maxAspectBatches"), 10, 1, 50);

    const opts = {
      conceptLimit,
      normalizeEntityLimit,
      normalizeAspectLimit,
      maxConceptBatches,
      maxEntityBatches,
      maxAspectBatches,
    };

    if (locationId) {
      const r = await runForLocation(locationId, opts);

      const out: RunResult = {
        ok: true,
        scope: "location",
        locationId,
        extracted_reviews: r.extracted_reviews,
        inserted_concepts: r.inserted_concepts,
        normalized_entities: r.normalized_entities,
        normalized_aspects: r.normalized_aspects,
      };

      return NextResponse.json(out);
    }

    const locations = await prisma.location.findMany({
      select: { id: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    let extracted_reviews = 0;
    let inserted_concepts = 0;
    let normalized_entities = 0;
    let normalized_aspects = 0;

    for (const loc of locations) {
      const r = await runForLocation(loc.id, opts);
      extracted_reviews += r.extracted_reviews;
      inserted_concepts += r.inserted_concepts;
      normalized_entities += r.normalized_entities;
      normalized_aspects += r.normalized_aspects;
    }

    const out: RunResult = {
      ok: true,
      scope: "global",
      locationId: null,
      extracted_reviews,
      inserted_concepts,
      normalized_entities,
      normalized_aspects,
    };

    return NextResponse.json(out);
  } catch (err: any) {
    console.error("[concepts/run] error", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
