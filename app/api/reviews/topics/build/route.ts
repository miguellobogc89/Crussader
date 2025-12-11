// app/api/reviews/topics/build/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import {
  clusterConcepts,
  type ConceptForClustering,
} from "@/app/server/topics/clusterConcepts";
import { generateTopicName } from "@/app/server/topics/generateTopicName";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const locationId = searchParams.get("locationId");
    const companyId = searchParams.get("companyId"); // ahora mismo no se guarda en topic, pero lo respetamos por si lo usas luego

    const recencyParam = searchParams.get("recencyDays");
    const limitParam = searchParams.get("limit");
    const minTopicSizeParam = searchParams.get("minTopicSize");
    const dryRunParam = searchParams.get("dryRun");

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId requerido" },
        { status: 400 },
      );
    }

    const hasRecencyFilter = recencyParam !== null;
    const recencyDays = hasRecencyFilter
      ? Math.max(1, Number(recencyParam || "180"))
      : 0;

    const limit = Math.max(1, Math.min(2000, Number(limitParam ?? 500)));
    const minTopicSize = Math.max(2, Number(minTopicSizeParam ?? 3));
    const dryRun = dryRunParam === "1";

    // 🔹 Contexto del negocio para nombrar topics (no afecta a la query)
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

    const businessType = loc?.type?.name ?? null;
    const activityName = loc?.type?.activity?.name ?? null;

    // Por ahora NO filtramos por fecha porque muchos concepts antiguos tienen review_date = NULL
    const concepts = await prisma.concept.findMany({
      where: {
        review: { locationId },
        topic_id: null,
      },
      select: {
        id: true,
        label: true,
        structured: true,
        rating: true,              // 👈 para calcular avg_rating por topic
      },
      take: limit,
    });

    if (concepts.length === 0) {
      return NextResponse.json({
        ok: true,
        locationId,
        taken: 0,
        topics: [],
        preview: { topics: [] },
        createdTopics: 0,
        assignedConcepts: 0,
        message: "No hay concepts pendientes para esta ubicación",
      });
    }

    // mapa id → rating para luego calcular avg_rating por topic
    const ratingById = new Map<string, number>();
    for (const c of concepts) {
      if (typeof c.rating === "number") {
        ratingById.set(c.id, c.rating);
      }
    }

    // Adaptar a ConceptForClustering
    const mapped = concepts.map((c) => {
      const s = (c.structured ?? {}) as any;

      const summary: string =
        (typeof s.summary === "string" && s.summary.trim().length > 0
          ? s.summary
          : c.label) ?? "";

      const judgmentRaw = String(s.judgment ?? "neutral").toLowerCase();
      const judgment: ConceptForClustering["judgment"] =
        judgmentRaw === "positive" ||
        judgmentRaw === "negative" ||
        judgmentRaw === "neutral"
          ? (judgmentRaw as ConceptForClustering["judgment"])
          : "neutral";

      if (!summary) return null;

      return {
        id: c.id,
        summary,
        entity:
          typeof s.entity === "string" && s.entity.trim().length > 0
            ? s.entity
            : null,
        aspect:
          typeof s.aspect === "string" && s.aspect.trim().length > 0
            ? s.aspect
            : null,
        category:
          typeof s.category === "string" && s.category.trim().length > 0
            ? s.category
            : null,
        judgment,
      };
    });

    const forClustering = mapped.filter(
      (x) => x !== null,
    ) as ConceptForClustering[];

    if (forClustering.length < minTopicSize) {
      return NextResponse.json({
        ok: true,
        locationId,
        taken: forClustering.length,
        topics: [],
        preview: { topics: [] },
        createdTopics: 0,
        assignedConcepts: 0,
        message: `Menos de ${minTopicSize} concepts disponibles, no se crean topics.`,
      });
    }

    // 🔹 Clustering semántico
    const clusters = await clusterConcepts(forClustering);

    if (!clusters.length) {
      return NextResponse.json({
        ok: true,
        locationId,
        taken: forClustering.length,
        topics: [],
        preview: { topics: [] },
        createdTopics: 0,
        assignedConcepts: 0,
        message: "No se han formado clusters suficientemente grandes.",
      });
    }

    // 🔹 Generar nombres y calcular avg_rating por cluster
    const previewTopics = await Promise.all(
      clusters.map(async (cluster) => {
        const name = await generateTopicName(
          {
            previewSummaries: cluster.previewSummaries,
          },
          {
            businessType,
            activityName,
          },
        );

        const conceptIds = cluster.conceptIds;
        let sum = 0;
        let count = 0;
        for (const id of conceptIds) {
          const r = ratingById.get(id);
          if (typeof r === "number") {
            sum += r;
            count++;
          }
        }
        const avgRating = count > 0 ? sum / count : null;

        return {
          name,
          size: conceptIds.length,
          conceptIds,
          avgRating,
        };
      }),
    );

    // 🔹 Persistencia real si no es dryRun
    let createdTopics = 0;
    let assignedConcepts = 0;

    if (!dryRun) {
      for (const t of previewTopics) {
        const topic = await prisma.topic.create({
          data: {
            label: t.name,
            description: null,                 // si quieres luego usamos un helper para descripción
            model: "text-embedding-3-small",
            concept_count: t.size,
            avg_rating: t.avgRating ?? null,
            is_stable: t.size >= minTopicSize,
          },
          select: { id: true },
        });

        createdTopics++;

        if (t.conceptIds && t.conceptIds.length > 0) {
          const res = await prisma.concept.updateMany({
            where: {
              id: { in: t.conceptIds },
            },
            data: {
              topic_id: topic.id,
              assigned_at: new Date(),
            },
          });

          assignedConcepts += res.count;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      locationId,
      companyId: companyId ?? null,
      taken: forClustering.length,
      dryRun,
      createdTopics,
      assignedConcepts,
      topics: previewTopics,
    });
  } catch (e: any) {
    console.error("/api/reviews/topics/build ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "error" },
      { status: 500 },
    );
  }
}
