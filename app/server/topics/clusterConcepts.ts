// app/server/topics/clusterConcepts.ts
//
// Agrupa concepts en topics usando embeddings de OpenAI (text-embedding-3-small).
// - Cada topic tiene al menos 3 concepts (minTopicSize = 3).
// - Si salen más de maxTopics (12), se quedan los más grandes
//   y los pequeños se fusionan con el cluster más cercano.
// - Pensado para trabajar sobre concepts ya estructurados.
//
// Uso esperado:
//   const clusters = await clusterConcepts(conceptsArray);
//
// Donde cada concept tiene como mínimo: id, summary, judgment.
// Opcionalmente entity/aspect/category para enriquecer el texto de embedding.
//

import { openai } from "../openaiClient";

const EMBEDDING_MODEL = "text-embedding-3-small";
const MIN_TOPIC_SIZE = 3;
const MAX_TOPICS = 12;

// Entrada mínima para clusterizar
export type ConceptForClustering = {
  id: string;
  summary: string;
  entity?: string | null;
  aspect?: string | null;
  category?: string | null;
  judgment: "positive" | "negative" | "neutral";
};

// Resultado de un cluster de topics
export type TopicCluster = {
  conceptIds: string[];
  centroid: number[];
  previewSummaries: string[]; // 2-3 summaries representativas
};

function buildEmbeddingText(c: ConceptForClustering): string {
  const parts: string[] = [];

  if (c.summary) parts.push(c.summary);
  if (c.entity) parts.push(`Entidad: ${c.entity}`);
  if (c.aspect) parts.push(`Aspecto: ${c.aspect}`);
  if (c.category) parts.push(`Categoría: ${c.category}`);
  parts.push(`Juicio: ${c.judgment}`);

  return parts.join(" | ");
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  const len = Math.min(a.length, b.length);

  for (let i = 0; i < len; i++) {
    const va = a[i];
    const vb = b[i];
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function averageVector(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const acc = new Array(dim).fill(0);

  for (const v of vectors) {
    for (let i = 0; i < dim; i++) {
      acc[i] += v[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    acc[i] /= vectors.length;
  }

  return acc;
}

/**
 * Hace clustering muy simple basado en similitud con un seed:
 * - Seed = primer concepto no asignado.
 * - Cluster = todos los conceptos con similitud >= threshold.
 * - Si el cluster tiene menos de minSize → se descarta (ruido).
 */
function greedyClustering(
  embeddings: number[][],
  concepts: ConceptForClustering[],
  similarityThreshold: number,
  minSize: number,
): TopicCluster[] {
  const n = concepts.length;
  const unassigned = new Set<number>();
  for (let i = 0; i < n; i++) unassigned.add(i);

  const clusters: TopicCluster[] = [];

  while (unassigned.size > 0) {
    const seedIndex = Array.from(unassigned)[0];
    const seedVector = embeddings[seedIndex];

    const members: number[] = [];

    for (const idx of unassigned) {
      const sim = cosineSimilarity(seedVector, embeddings[idx]);
      if (sim >= similarityThreshold) {
        members.push(idx);
      }
    }

    // Quitamos todos los miembros de unassigned
    for (const idx of members) {
      unassigned.delete(idx);
    }

    if (members.length >= minSize) {
      const memberVectors = members.map((i) => embeddings[i]);
      const centroid = averageVector(memberVectors);

      // 2-3 summaries representativas (las más largas o las primeras)
      const previewSummaries = members
        .slice(0, 3)
        .map((i) => concepts[i].summary);

      clusters.push({
        conceptIds: members.map((i) => concepts[i].id),
        centroid,
        previewSummaries,
      });
    }
    // Si no llega al tamaño mínimo, se ignora (se pierde esa semilla),
    // porque la idea es que un topic represente algo recurrente.
  }

  return clusters;
}

/**
 * Si hay más clusters que MAX_TOPICS, nos quedamos con los más grandes
 * y asignamos los pequeños al cluster cuya centroid esté más cerca
 * (mayor similitud coseno).
 */
function enforceMaxTopics(
  clusters: TopicCluster[],
  maxTopics: number,
): TopicCluster[] {
  if (clusters.length <= maxTopics) return clusters;

  // Ordenamos por tamaño desc
  const sorted = [...clusters].sort(
    (a, b) => b.conceptIds.length - a.conceptIds.length,
  );

  const main = sorted.slice(0, maxTopics);
  const rest = sorted.slice(maxTopics);

  for (const small of rest) {
    let bestIndex = 0;
    let bestSim = -Infinity;

    for (let i = 0; i < main.length; i++) {
      const sim = cosineSimilarity(small.centroid, main[i].centroid);
      if (sim > bestSim) {
        bestSim = sim;
        bestIndex = i;
      }
    }

    // Fusionamos small en main[bestIndex]
    main[bestIndex] = {
      conceptIds: main[bestIndex].conceptIds.concat(small.conceptIds),
      centroid: averageVector([
        main[bestIndex].centroid,
        small.centroid,
      ]),
      previewSummaries: main[bestIndex].previewSummaries,
    };
  }

  return main;
}

/**
 * Clusteriza concepts en topics usando embeddings.
 *
 * - Usa text-embedding-3-small.
 * - Min 3 concepts por topic.
 * - Máx 12 topics (el resto se fusionan).
 * - Devuelve solo clusters válidos; los concepts que no entran
 *   en ningún cluster se consideran ruido y quedan fuera.
 */
export async function clusterConcepts(
  concepts: ConceptForClustering[],
): Promise<TopicCluster[]> {
  if (concepts.length < MIN_TOPIC_SIZE) {
    return [];
  }

  // Texto para embedding por concept
  const inputs = concepts.map(buildEmbeddingText);

  const resp = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: inputs,
  });

  const embeddings = resp.data.map((row) => row.embedding);

  // Umbral de similitud: 0.80 es razonable para topics; si ves demasiados
  // clusters pequeños, puedes bajar a 0.75; si se agrupa demasiado, subir a 0.85.
  const rawClusters = greedyClustering(
    embeddings,
    concepts,
    0.8,
    MIN_TOPIC_SIZE,
  );

  if (rawClusters.length === 0) return [];

  const finalClusters = enforceMaxTopics(rawClusters, MAX_TOPICS);

  // Recalcular previews tras posibles merges
  return finalClusters.map((cluster) => {
    const previews = cluster.conceptIds
      .slice(0, 3)
      .map((id) => {
        const idx = concepts.findIndex((c) => c.id === id);
        return idx >= 0 ? concepts[idx].summary : "";
      })
      .filter(Boolean);

    return {
      ...cluster,
      previewSummaries: previews,
    };
  });
}
