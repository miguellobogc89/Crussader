// app/server/openaiClient.ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Modelos por defecto (ajústalos si quieres)
export const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 dims
export const LABEL_MODEL = "gpt-4o-mini"; // económico y muy bueno nombrando
