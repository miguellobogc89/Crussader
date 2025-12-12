// app/api/reviews/topics/build/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import {
  clusterConcepts,
  type ConceptForClustering,
} from "@/app/server/topics/clusterConcepts";
import { generateTopicName } from "@/app/server/topics/generateTopicName";
import { openai } from "@/app/server/openaiClient";

export const runtime = "nodejs";
export const revalidate = 0;

type PreviewTopic = {
  name: string;
  size: number;
  conceptIds: string[];
  avgRating: number | null;

  // 🔹 firma para embeddings/merge (no se persiste)
  signature: string;
};

const EMBED_MODEL = "text-embedding-3-small";

// Ajusta si quieres: 0.88–0.92 suele ir bien para nombres cortos
const HIST_MERGE_THRESHOLD = 0.88;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const locationId = searchParams.get("locationId");
    const companyId = searchParams.get("companyId");

    const limitParam = searchParams.get("limit");
    const minTopicSizeParam = searchParams.get("minTopicSize");
    const dryRunParam = searchParams.get("dryRun");

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId requerido" },
        { status: 400 },
      );
    }

    const limit = Math.max(1, Math.min(2000, Number(limitParam ?? 500)));
    const minTopicSize = Math.max(2, Number(minTopicSizeParam ?? 3));
    const dryRun = dryRunParam === "1";

    // 🔹 Contexto del negocio para nombrar topics
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

    // 🔹 Concepts pendientes (sin topic_id) de esa location
    const concepts = await prisma.concept.findMany({
      where: {
        review: { locationId },
        topic_id: null,
      },
      select: {
        id: true,
        label: true,
        structured: true,
        rating: true,
      },
      take: limit,
    });

    if (concepts.length === 0) {
      return NextResponse.json({
        ok: true,
        locationId,
        taken: 0,
        topics: [],
        createdTopics: 0,
        assignedConcepts: 0,
        message: "No hay concepts pendientes para esta ubicación",
      });
    }

    // mapa id → rating
    const ratingById = new Map<string, number>();
    for (const c of concepts) {
      if (typeof c.rating === "number") ratingById.set(c.id, c.rating);
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
        createdTopics: 0,
        assignedConcepts: 0,
        message: "No se han formado clusters suficientemente grandes.",
      });
    }

    // 🔹 Generar nombres + avgRating + signature
    const previewTopics: PreviewTopic[] = await Promise.all(
      clusters.map(async (cluster) => {
        const name = await generateTopicName(
          { previewSummaries: cluster.previewSummaries },
          { businessType, activityName },
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

        // signature: nombre + 5 ejemplos (mejora el embedding)
        const examples = cluster.previewSummaries.slice(0, 5).join(" | ");
        const signature = `${name} :: ${examples}`.slice(0, 700);

        return { name, size: conceptIds.length, conceptIds, avgRating, signature };
      }),
    );

    // 🔹 Merge intra-batch (texto similar)
    const mergedPreviewTopics = mergePreviewTopics(previewTopics);

    // 🔹 Límite blando (10–15) según nº concepts total
    const [existingTopicsForLocation, totalConceptsForLocation] =
      await Promise.all([
        prisma.topic.findMany({
          where: {
            concept: { some: { review: { locationId } } },
          },
          select: { id: true, label: true, concept_count: true, avg_rating: true },
        }),
        prisma.concept.count({ where: { review: { locationId } } }),
      ]);

    const existingCount = existingTopicsForLocation.length;

    let maxTopics = 10;
    if (totalConceptsForLocation > 150) maxTopics = 15;
    else if (totalConceptsForLocation > 50) maxTopics = 12;

    const availableSlots = Math.max(0, maxTopics - existingCount);

    // Elegimos candidatos del batch: grandes primero
    const sortedCandidates = [...mergedPreviewTopics].sort((a, b) => b.size - a.size);

    // 🔹 Embeddings de topics existentes (para merge histórico)
    // signature existente = label (y si quieres, más adelante añadimos ejemplos por DB)
    const existingSignatures = existingTopicsForLocation.map((t) => t.label);
    const existingEmbeds = existingSignatures.length
      ? await embedTexts(existingSignatures)
      : [];

    // 🔹 Persistencia real
    let createdTopics = 0;
    let assignedConcepts = 0;
    let mergedIntoExisting = 0;

    // contador de slots consumidos por nuevos topics
    let newTopicsUsed = 0;

    // pool local de topics existentes (para actualizar embeds si creamos nuevos)
    const pool: {
      id: string;
      label: string;
      embed: number[] | null;
    }[] = existingTopicsForLocation.map((t, idx) => ({
      id: t.id,
      label: t.label,
      embed: existingEmbeds[idx] ?? null,
    }));

    // embeddings de candidatos (una llamada)
    const candidateEmbeds = await embedTexts(sortedCandidates.map((t) => t.signature));

    for (let i = 0; i < sortedCandidates.length; i++) {
      const cand = sortedCandidates[i];
      const candEmbed = candidateEmbeds[i] ?? null;

      // Si no hay embedding, no hacemos merge histórico (pero aún podemos crear)
      let bestId: string | null = null;
      let bestScore = 0;

      if (candEmbed && pool.length > 0) {
        for (const ex of pool) {
          if (!ex.embed) continue;
          const score = cosineSim(candEmbed, ex.embed);
          if (score > bestScore) {
            bestScore = score;
            bestId = ex.id;
          }
        }
      }

      // ✅ MERGE HISTÓRICO: si se parece a un topic existente, reasignamos concepts
      if (!dryRun && bestId && bestScore >= HIST_MERGE_THRESHOLD) {
        const res = await prisma.concept.updateMany({
          where: { id: { in: cand.conceptIds } },
          data: {
            topic_id: bestId,
            assigned_at: new Date(),
          },
        });

        assignedConcepts += res.count;
        mergedIntoExisting++;
        continue;
      }

      // Si no se fusiona con histórico, solo creamos si hay slots disponibles
      if (newTopicsUsed >= availableSlots) {
        continue;
      }

      if (!dryRun) {
        const topic = await prisma.topic.create({
          data: {
            label: cand.name,
            description: null,
            model: EMBED_MODEL,
            concept_count: cand.size,
            avg_rating: cand.avgRating ?? null,
            is_stable: cand.size >= minTopicSize,
          },
          select: { id: true },
        });

        createdTopics++;
        newTopicsUsed++;

        const res = await prisma.concept.updateMany({
          where: { id: { in: cand.conceptIds } },
          data: {
            topic_id: topic.id,
            assigned_at: new Date(),
          },
        });

        assignedConcepts += res.count;

        // añadir al pool para que siguientes candidatos puedan fusionar con éste también
        // (esto reduce duplicados dentro de la misma ejecución aunque falle el merge por texto)
        if (candEmbed) {
          pool.push({ id: topic.id, label: cand.name, embed: candEmbed });
        } else {
          pool.push({ id: topic.id, label: cand.name, embed: null });
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
      mergedIntoExisting,
      topics: mergedPreviewTopics.map((t) => ({
        name: t.name,
        size: t.size,
        avgRating: t.avgRating,
      })),
      meta: {
        totalConceptsForLocation,
        existingTopics: existingCount,
        maxTopics,
        availableSlots,
        histMergeThreshold: HIST_MERGE_THRESHOLD,
      },
    });
  } catch (e: any) {
    console.error("/api/reviews/topics/build ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "error" },
      { status: 500 },
    );
  }
}

/* -------------------- helpers -------------------- */

async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];

  // limpieza para evitar inputs vacíos
  const cleaned = texts.map((t) => String(t ?? "").trim()).filter((t) => t.length > 0);
  if (!cleaned.length) return [];

  const resp = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: cleaned,
  });

  return (resp.data ?? []).map((d: any) => d.embedding as number[]);
}

function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const den = Math.sqrt(na) * Math.sqrt(nb);
  return den === 0 ? 0 : dot / den;
}

/**
 * Merge intra-batch por solapamiento de tokens (rápido y determinista).
 */
function mergePreviewTopics(input: PreviewTopic[]): PreviewTopic[] {
  const result: PreviewTopic[] = [];

  for (const t of input) {
    const tokensT = tokenizeTopicName(t.name);
    let merged = false;

    for (const existing of result) {
      const tokensE = tokenizeTopicName(existing.name);
      const score = jaccard(tokensT, tokensE);

      if (score >= 0.6) {
        const mergedIds = new Set<string>();
        for (const id of existing.conceptIds) mergedIds.add(id);
        for (const id of t.conceptIds) mergedIds.add(id);

        existing.conceptIds = Array.from(mergedIds);
        existing.size = existing.conceptIds.length;

        const hasA = typeof existing.avgRating === "number";
        const hasB = typeof t.avgRating === "number";
        if (hasA && hasB) existing.avgRating = (existing.avgRating! + t.avgRating!) / 2;
        else if (hasB && !hasA) existing.avgRating = t.avgRating;

        // unir firmas para que el embedding represente mejor el tema
        existing.signature = `${existing.signature} | ${t.signature}`.slice(0, 900);

        merged = true;
        break;
      }
    }

    if (!merged) result.push({ ...t });
  }

  return result;
}

const STOPWORDS_ES = new Set([
  "de",
  "del",
  "la",
  "el",
  "las",
  "los",
  "y",
  "en",
  "al",
  "por",
  "para",
  "con",
  "un",
  "una",
  "unos",
  "unas",
  "cliente",
  "clientes",
  "servicio",
  "producto",
  "productos",
  "tema",
  "sobre",
  "mas",
  "muy",
]);

function tokenizeTopicName(name: string): Set<string> {
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const tokens = normalized
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS_ES.has(t));

  return new Set(tokens);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}
