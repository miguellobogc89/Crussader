import { NextResponse } from "next/server";
import { z } from "zod";

const ReviewSchema = z.object({
  content: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  author: z.string().optional(),
});

const SettingsSchema = z.object({
  businessName: z.string().optional(),
  sector: z.string().optional(),
  treatment: z.enum(["tu", "usted"]).optional(),
  tone: z.number().min(0).max(5).optional(),
  emojiIntensity: z.number().min(0).max(3).optional(),
  language: z.enum(["es", "en", "pt"]).optional(),
  autoDetectLanguage: z.boolean().optional(),
  ctaByRating: z
    .object({
      "1-2": z.object({ channel: z.string().optional(), contact: z.string().optional(), text: z.string().optional() }).optional(),
      "3": z.object({ channel: z.string().optional(), contact: z.string().optional(), text: z.string().optional() }).optional(),
      "4-5": z.object({ channel: z.string().optional(), contact: z.string().optional(), text: z.string().optional() }).optional(),
    })
    .partial()
    .optional(),
  showCTAWhen: z.enum(["never", "below3", "always"]).optional(),
  model: z.string().optional(),
  creativity: z.number().min(0).max(1).optional(),
  maxCharacters: z.number().min(50).max(2000).optional(),
}).passthrough(); // admite más campos sin romper

const BodySchema = z.object({
  settings: SettingsSchema,
  review: ReviewSchema,
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const { settings, review } = parsed.data;

  // Construcción simplificada del prompt (ajústalo con tu builder real cuando quieras)
  const treatment = settings.treatment === "usted" ? "usted" : "tú";
  const lang = settings.language ?? "es";
  const tone = settings.tone ?? 3;
  const emojiLevel = settings.emojiIntensity ?? 1;
  const business = settings.businessName ?? "Tu negocio";

  const system = [
    `Eres un asistente que redacta respuestas a reseñas para "${business}".`,
    `Idioma objetivo: ${lang}.`,
    `Tratamiento: ${treatment}.`,
    `Tono (0–5): ${tone}.`,
    `Intensidad de emojis (0–3): ${emojiLevel}.`,
    `Respeta políticas de la marca y evita frases prohibidas si están definidas en settings.`,
    `Adapta el contenido a la valoración (1–5) y aplica CTA según configuración cuando proceda.`,
  ].join("\n");

  const user = [
    `RESEÑA (${review.rating}★) de ${review.author ?? "Cliente"}:`,
    review.content,
    ``,
    `Escribe una respuesta breve, sincera y alineada con los ajustes.`,
  ].join("\n");

  return NextResponse.json({ ok: true, system, user });
}
