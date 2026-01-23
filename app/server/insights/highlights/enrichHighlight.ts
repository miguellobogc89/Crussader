// app/server/insights/highlights/enrichHighlight.ts
import { openai } from "@/app/server/openaiClient";

const MODEL = "gpt-4o-mini";

// Set cerrado de iconos (evita inventos y mantiene estilo consistente)
const ICONS = [
  "Medal",
  "Sparkles",
  "ThumbsUp",
  "HeartHandshake",
  "Coffee",
  "IceCream",
  "ShoppingBag",
  "Store",
  "Users",
  "Clock",
  "MapPin",
  "CreditCard",
  "Receipt",
  "Table",
  "AlertTriangle",
  "XCircle",
  "TrendingUp",
  "TrendingDown",
  "BadgeCheck",
  "BadgeX",
] as const;

export type HighlightBlock = "success" | "improve" | "attention";

export type EnrichedHighlight = {
  label: string;
  icon: (typeof ICONS)[number];
  copy: string; // 1 línea, tono humano
};

export async function enrichHighlight(args: {
  label: string;
  block: HighlightBlock;
  mentions: number;
  // contexto opcional por si luego quieres afinar
  businessName?: string | null;
  businessType?: string | null;
  activityName?: string | null;

  // “pistas” opcionales: 1–3 entities frecuentes y/o 1–2 ejemplos de summary (si luego los pasamos)
  hints?: {
    top_entities?: string[];
    sample_summaries?: string[];
  };
}): Promise<EnrichedHighlight> {
const sys = [
  "Eres copywriter de producto para un dashboard de reseñas.",
  "Devuelve SOLO JSON con: { icon, copy }.",
  "",
  "Objetivo:",
  "- copy: 1 frase corta, natural, en español, entendible por un cliente no técnico.",
  "- NO inventes hechos. Si no hay hints, habla en general (“se menciona”, “aparece en reseñas”).",
  "",
  "Tono por bloque (OBLIGATORIO):",
  "- success: positivo y concreto, sin exagerar.",
  "- improve: constructivo: sugiere que es una oportunidad, NO digas que está bien. Evita 'justo', 'asequible', 'perfecto'.",
  "- attention: claro y serio, sin alarmismo.",
  "",
  "Icono (OBLIGATORIO):",
  "- Elige el icono más obvio por label.",
  "- Si label contiene 'precio' => usa 'Receipt' o 'CreditCard'.",
  "- Si label contiene 'cobro' => usa 'CreditCard' o 'Receipt'.",
  "- Si label contiene 'mesa' => usa 'Table'.",
  "- Si label contiene 'sabor' o 'helado' => usa 'IceCream'.",
  "- Si dudas => 'Sparkles'.",
  "",
  "Restricciones:",
  "- No menciones nada técnico (concepts/sentiment/normalized).",
  "- icon debe ser UNO de esta lista exacta: " + JSON.stringify(ICONS),
].join("\n");


  const payload = {
    label: args.label,
    block: args.block,
    mentions: args.mentions,
    business: {
      name: args.businessName ?? null,
      type: args.businessType ?? null,
      activity: args.activityName ?? null,
    },
    hints: args.hints ?? {},
  };

  const resp = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: JSON.stringify(payload) },
    ],
    max_tokens: 180,
  });

  const raw = resp.choices?.[0]?.message?.content?.trim() ?? "{}";

  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const icon = String(parsed.icon ?? "").trim();
  const copy = String(parsed.copy ?? "").trim();

  const safeIcon = (ICONS as readonly string[]).includes(icon) ? (icon as EnrichedHighlight["icon"]) : "Sparkles";

  const safeCopy =
    copy.length > 0
      ? copy.slice(0, 140)
      : args.block === "success"
        ? `Tus clientes mencionan mucho “${args.label}”.`
        : args.block === "attention"
          ? `Ojo con “${args.label}”: aparece en reseñas delicadas.`
          : `“${args.label}” puede ser una palanca de mejora.`;

  return {
    label: args.label,
    icon: safeIcon,
    copy: safeCopy,
  };
}
