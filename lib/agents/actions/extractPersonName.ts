// lib/agents/actions/extractPersonName.ts
import { openai } from "@/lib/ai";

function safeJsonParse(raw: string): any | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function extractPersonName(args: {
  text: string;
}): Promise<{ firstName: string; lastName: string } | null> {
  const text = String(args.text || "").trim();
  if (!text) return null;

  const system = [
    "Extrae nombre y apellidos si el mensaje contiene claramente un nombre real de persona.",
    "No inventes. Si no estás seguro, devuelve null.",
    "Salida estricta: JSON sin markdown.",
    'Ejemplos:',
    'Input: "Miguel Lobo" => {"firstName":"Miguel","lastName":"Lobo"}',
    'Input: "soy Miguel" => null',
    'Input: "Miguel Lobo García" => {"firstName":"Miguel","lastName":"Lobo García"}',
    'Input: "quiero cita" => null',
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 80,
    messages: [
      { role: "system", content: system },
      { role: "user", content: text },
    ],
  });

  const raw = String(completion.choices?.[0]?.message?.content || "").trim();
  const parsed = raw ? safeJsonParse(raw) : null;

  if (!parsed) return null;

  const firstName = typeof parsed.firstName === "string" ? parsed.firstName.trim() : "";
  const lastName = typeof parsed.lastName === "string" ? parsed.lastName.trim() : "";

  if (!firstName || !lastName) return null;

  return { firstName, lastName };
}