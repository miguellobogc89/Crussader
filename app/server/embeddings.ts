// app/server/embeddings.ts
// ==============================================
// 📌 Descripción:
// Funciones de embeddings y utilidades matemáticas:
//  - embedTexts / embedText: obtiene embeddings con OpenAI.
//  - cosine: similitud coseno entre dos vectores.
//  - centroid: media componente a componente de múltiples vectores.
//  - toPgVectorLiteral: serializa number[] a literal pgvector ('[...']::vector).
//
// Dependencias:
//  - openai y EMBEDDING_MODEL desde app/server/openaiClient.ts
// Requisitos:
//  - pgvector instalado (vector(1536)) en BD.
//  - EMBEDDING_MODEL por defecto: "text-embedding-3-small" (1536 dims).
// ==============================================

import { openai, EMBEDDING_MODEL } from "./openaiClient";

export const EMBEDDING_DIM = 1536;

/** Serializa un vector a literal pgvector, útil para SQL crudo. */
export function toPgVectorLiteral(vec: number[]): string {
  if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIM) {
    throw new Error(`toPgVectorLiteral: dimensión inválida: ${vec?.length} (esperado ${EMBEDDING_DIM})`);
  }
  // Formato aceptado por pgvector: '[v1, v2, ...]'
  return `'[${vec.join(",")}]'::vector`;
}

/** Similaridad coseno (devuelve [-1..1]). */
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("cosine: vectores con distinta dimensión");
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Centroid (media) de una lista de vectores. */
export function centroid(vectors: number[][]): number[] {
  if (!vectors.length) throw new Error("centroid: lista vacía");
  const dim = vectors[0].length;
  const out = new Array(dim).fill(0);
  for (const v of vectors) {
    if (v.length !== dim) throw new Error("centroid: dimensiones no coinciden");
    for (let i = 0; i < dim; i++) out[i] += v[i];
  }
  for (let i = 0; i < dim; i++) out[i] /= vectors.length;
  return out;
}

/** Embedding de un único texto (con normalización opcional). */
export async function embedText(text: string, normalize = true): Promise<number[]> {
  const [v] = await embedTexts([text], normalize);
  return v;
}

/** Embeddings batched (OpenAI soporta array de inputs). */
export async function embedTexts(texts: string[], normalize = true): Promise<number[][]> {
  if (!texts || texts.length === 0) return [];
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL || "text-embedding-3-small",
    input: texts.map((t) => t ?? ""),
  });

  const out = res.data.map((d) => {
    // En el SDK v5, cada item tiene 'embedding: number[]'
    const v = d.embedding as unknown as number[];
    return normalize ? l2normalize(v) : v;
  });

  // Verificación de dimensión
  for (const v of out) {
    if (v.length !== EMBEDDING_DIM) {
      throw new Error(`Dimensión de embedding inesperada: ${v.length} (esperado ${EMBEDDING_DIM})`);
    }
  }
  return out;
}

/** Normaliza un vector a norma L2 = 1 (mejora estabilidad del coseno). */
function l2normalize(v: number[]): number[] {
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm);
  if (norm === 0) return v.slice();
  return v.map((x) => x / norm);
}
