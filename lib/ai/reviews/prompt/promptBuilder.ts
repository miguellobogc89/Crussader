// lib/ai/reviews/prompt/promptBuilder.ts
import type { ResponseSettings } from "@/app/schemas/response-settings";

const TONES = ["sereno", "neutral", "profesional", "cercano", "amable", "entusiasta"] as const;
const EMOJI_HINT = ["sin emojis", "pocos emojis", "algunos emojis", "varios emojis"] as const;

const LENGTH_HINTS: Record<number, string> = {
  0: "Muy breve (1-2 frases).",
  1: "Breve (2-3 frases).",
  2: "Medio (3-5 frases).",
};

type Bucket = "1-2" | "3" | "4-5";

function pickStarBucket(rating: number): Bucket {
  if (rating <= 2) return "1-2";
  if (rating === 3) return "3";
  return "4-5";
}

function decideLanguage(cfg: ResponseSettings, detected?: string | null) {
  if (!cfg.autoDetectLanguage) return cfg.language;
  const code = (detected ?? "").slice(0, 2).toLowerCase();
  if (["es", "en", "pt"].includes(code)) return code as "es" | "en" | "pt";
  return cfg.language;
}

export function buildMessagesFromSettings(
  cfg: ResponseSettings,
  review: {
    rating: number;
    comment: string | null;
    languageCode?: string | null;
    reviewerName?: string | null;
  }
) {
  const lang = decideLanguage(cfg, review.languageCode);
  const toneName = TONES[cfg.tone] ?? "neutral";
  const emojiHint = EMOJI_HINT[cfg.emojiIntensity] ?? "pocos emojis";
  const bucket: Bucket = pickStarBucket(review.rating);
  const starCfg = cfg.starSettings[bucket];

  const objectiveMap: Record<string, Record<"es" | "en" | "pt", string>> = {
    apology: { es: "Pide disculpas y ofrece ayuda", en: "Apologize and offer help", pt: "Peça desculpas e ofereça ajuda" },
    neutral: { es: "Responde de forma neutral y cortés", en: "Respond neutrally and politely", pt: "Responda de forma neutra e educada" },
    thanks:  { es: "Agradece calurosamente y refuerza lo positivo", en: "Warmly thank and reinforce positives", pt: "Agradeça calorosamente e reforce o positivo" },
  };
  const objective = objectiveMap[starCfg.objective]?.[lang] ?? objectiveMap.neutral[lang];

  // Firma normalizada (añade '— ' si el usuario no lo puso)
  const sigRaw = (cfg.standardSignature ?? "").trim();
  const finalSignature = sigRaw ? (sigRaw.startsWith("—") ? sigRaw : `— ${sigRaw}`) : "";

  // CTA según reglas (usa ctaByRating por bucket)
  let cta = "";
  const ruleAllows =
    cfg.showCTAWhen === "always" ||
    (cfg.showCTAWhen === "below3" && review.rating < 3) ||
    (cfg.showCTAWhen === "above4" && review.rating >= 4);

  const ctaCfg = cfg.ctaByRating?.[bucket];
  if (ruleAllows && starCfg.enableCTA && ctaCfg?.text?.trim()) {
    cta = ctaCfg.text.trim();
    // Si quisieras empujar también el contacto al modelo, podrías añadir:
    // if (ctaCfg.contact?.trim()) cta += ` (${ctaCfg.contact.trim()})`;
  }

  // Hints
  const lengthHint = LENGTH_HINTS[starCfg.length] ?? "";
  const customer =
    review.reviewerName?.trim() ||
    (lang === "es" ? "el cliente" : lang === "pt" ? "o cliente" : "the customer");
  const comment = (review.comment ?? "").trim();

  const system = [
    `Eres un asistente que redacta respuestas a reseñas para  (${cfg.sector}).`,
    `Escribe en ${lang}. Usa el tratamiento de ${cfg.treatment === "tu" ? "tuteo" : "usted"}.`,
    `Tono: ${toneName}. Emplea ${emojiHint}, solo si encaja.`,
    `Objetivo principal: ${objective}.`,
    `Respeta un máximo de ${cfg.maxCharacters} caracteres.`,
    lengthHint,
    // Reglas para evitar confusión de nombres
    `El nombre del cliente es "${customer}". Si decides usar su nombre, usa solo el del cliente y nunca el del negocio.`,
    finalSignature ? `La firma del negocio es: ${finalSignature}. Debe ir al final en una línea nueva, exactamente así.` : "",
    `No inventes nombres: si no estás seguro, no uses el nombre del cliente.`,
    cfg.noPublicCompensation ? "No prometas compensaciones públicas ni descuentos." : "",
    cfg.avoidPersonalData ? "No pidas datos personales en público (email/teléfono/dirección)." : "",
    cfg.bannedPhrases.length ? `Evita estas frases exactas: ${cfg.bannedPhrases.join(" | ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const userParts = [
    `Reseña (${review.rating}★) de ${customer}:`,
    comment ? `"${comment}"` : "(Sin comentario).",
    cta ? `Incluye una llamada a la acción sutil: "${cta}".` : "",
    // la firma ya se fuerza en system; no repetimos aquí
  ].filter(Boolean);

  const user = userParts.join("\n");

  return {
    system,
    user,
    targetLang: lang,
    model: cfg.model,
    temperature: cfg.creativity,
    maxChars: cfg.maxCharacters,
  };
}
