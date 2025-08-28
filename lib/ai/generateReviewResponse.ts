// lib/ai/generateReviewResponse.ts
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Input = {
  comment: string;
  rating: number;
  businessType?: string | null;
  language?: string;   // "es" por defecto
  tone?: string;       // "cordial", "profesional", etc.
};

export async function generateReviewResponse(input: Input): Promise<string> {
  const lang = input.language ?? "es";
  const tone = input.tone ?? "cordial";
  const bt = input.businessType ?? "Negocio";

  const system = `
Eres el encargado de responder reseñas de un ${bt}.
Responde en ${lang}, tono ${tone}, breve (2-4 frases), sin emojis, sin repetir la reseña.
Si la reseña es negativa, pide disculpas y ofrece ayuda concreta (contacto o próxima visita).
Si es positiva, agradece y refuerza un punto fuerte mencionado.
Nunca inventes datos ni promociones agresivas.
`.trim();

  const user = `
Reseña:
- Rating: ${input.rating} estrellas
- Comentario: """${input.comment}"""
`.trim();

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = resp.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("No se pudo generar contenido");
  }
  return content;
}
