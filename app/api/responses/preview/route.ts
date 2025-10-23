// app/api/generate-response/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai"; // o el cliente que uses
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const schema = z.object({
  prompt: z.string(),
  model: z.string().default("gpt-4o"),
  creativity: z.number().min(0).max(1).default(0.7),
  maxCharacters: z.number().min(100).max(1000),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { prompt, model, creativity, maxCharacters } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: creativity,
      messages: [
        { role: "system", content: "Eres un asistente que responde a reseñas con el estilo proporcionado." },
        { role: "user", content: prompt },
      ],
    });

    const fullText = completion.choices?.[0]?.message?.content?.trim() || "";
    const trimmed = fullText.slice(0, maxCharacters);

    return NextResponse.json({ result: trimmed });
  } catch (e) {
    console.error("OpenAI error:", e);
    return NextResponse.json({ error: "Error generando respuesta" }, { status: 500 });
  }
}
