// app/server/topics/embeddings.ts
import { openai } from "@/app/server/openaiClient";

export async function embedConceptLabels(labels: string[]) {
  if (!labels.length) return [];

  const resp = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: labels,
  });

  // Devuelve un embedding por label, en el mismo orden
  return resp.data.map((row) => row.embedding);
}
