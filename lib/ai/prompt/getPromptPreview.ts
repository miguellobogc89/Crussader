// lib/ai/prompt/getPromptPreview.ts
import type { ResponseSettings } from "@/app/schemas/response-settings";

interface GetPromptPreviewOptions {
  review: {
    content: string;
    stars: 1 | 3 | 5;
  };
  settings: ResponseSettings;
}

export function getPromptPreview({ review, settings }: GetPromptPreviewOptions) {
  const { stars } = review;
  const bucket = stars <= 2 ? "1-2" : stars === 3 ? "3" : "4-5";

  const starConfig = settings.starSettings?.[bucket];
  const ctaConfig = settings.ctaByRating?.[bucket];

  // Mapas de valores
  const toneLabels = ["sereno", "neutral", "profesional", "cercano", "amable", "entusiasta"];
  const lengthLabels = ["breve", "media", "detallada"];

  const language = settings.autoDetectLanguage ? "auto" : settings.language;
  const tone = toneLabels[settings.tone] || "neutral";
  const length = lengthLabels[starConfig?.length ?? 1] || "media";

  const targetChars =
    starConfig?.length === 0 ? 250 : starConfig?.length === 2 ? 700 : 450;

  const hasCTA = !!(starConfig?.enableCTA && ctaConfig?.text?.trim());

  // Normalizaciones ligeras
  const sector = (settings.sector ?? "").trim();
  const signature = (settings.standardSignature ?? "").trim();

  // Mensaje system — instrucciones al modelo
  const system = [
    `Eres un asistente que redacta respuestas a reseñas de clientes.`,
    `Usa un tono ${tone}, con una longitud ${length}, en idioma ${language}, tratamiento en "${settings.treatment}".`,
    `El negocio es del tipo "${sector || "no especificado"}".`,
    `Responde de forma empática y natural, evita datos falsos y no inventes información.`,
    `⚠️ Importante: NO incluyas la firma del negocio en el texto. La firma se añadirá después del salto de línea.`,
  ].join(" ");

  // Mensaje user — caso concreto
  const userLines = [
    `Reseña: "${review.content}"`,
    `Objetivo: ${starConfig?.objective || "responder adecuadamente"}`,
    `Tono: ${tone} (nivel ${settings.tone})`,
    `Longitud: ${length} (${targetChars} caracteres máximo)`,
    `Emojis: intensidad ${settings.emojiIntensity}`,
    `Firma estándar (añadida después, no repetir): ${signature || "Ninguna"}`,
    `Incluir CTA: ${hasCTA ? `${ctaConfig?.text} (${ctaConfig?.channel})` : "No"}`,
    `Idioma: ${language}`,
    `Tratamiento: "${settings.treatment}"`,
  ];

  const user = userLines.join("\n");

  return {
    system,
    user,
    model: settings.model,
    temperature: settings.creativity,
    targetChars,
    applied: {
      stars,
      bucket,
      tone,
      length,
      emojiLevel: settings.emojiIntensity,
      maxCharacters: targetChars,
      formality: settings.treatment,
      hasCTA,
      signature,
      sector,
    },
  };
}
