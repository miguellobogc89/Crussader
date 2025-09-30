// app/dashboard/voiceagent/_lib/template.ts
// Prompt Builder v2.1 — Reglas Duras + Estilo + Controles finos (brevedad, formalidad, calidez, asertividad, emojis)
// Los datos reales (horarios/precios) vienen SOLO desde BusinessContext/knowledge.

export const PROMPT_BUILDER_VERSION = "v2.1.0";

export type LLMRole = "system" | "user" | "assistant" | "tool";
export type LLMMessage = { role: LLMRole; content: string; name?: string };

export type BusinessContext = {
  companyName?: string;
  brandVoiceAllowedEmojis?: boolean;
  timezone?: string;
  locale?: string;
  openingHoursText?: string;   // p.ej. "L-V 10:00-20:30; S 10:00-14:00"
  basePricesText?: string;     // p.ej. "Higiene facial desde 39€…"
  policiesText?: string;       // p.ej. "Cancelación 24h, check-in 14:00"
  availabilityHint?: string;   // p.ej. "Hoy hay huecos a las 17:30 y 19:00"
};

export type AgentStyleId = "style_clinic_v1" | "style_restaurant_v1" | "style_hotel_v1";

export type AgentStylePreset = {
  id: AgentStyleId;
  persona: string;
  vocabulary: string[];
  structure: string;       // estructura esperada en 2 frases
  samplePhrases: string[]; // ejemplos sin números/horas (guía de tono)
};

export type StyleControls = {
  maxSentences?: number;                     // 1..4 (default 2)
  includeExample?: boolean;                  // exigir 1 ejemplo si hay datos
  formality?: 0 | 1 | 2;                     // 0=cercano 1=neutral 2=formal
  warmth?: 0 | 1 | 2;                        // 0=seco    1=neutral 2=empático
  assertiveness?: 0 | 1 | 2;                 // 0=informativo 1=guía 2=cierre/CTA
  allowEmojis?: "off" | "light" | "on";      // solo en display_text
  uncertaintyPolicy?: "admit_and_offer_next";// cómo tratar datos faltantes
};

export type AgentRulesConfig = {
  maxSentences: number;
  includeConcreteExample: boolean;
  forbidLists: boolean;
  avoidJargon: boolean;
  ifMissingKeyData: "offerAlt" | "stateUnknown";
  rulesVersion: string;
};

export type AgentSettings = {
  llm?: { model?: string; temperature?: number; maxTokens?: number };
  style?: {
    preset?: AgentStyleId;
    language?: "es" | "en";
    closingQuestion?: boolean;
    controls?: StyleControls;
  };
};

export type PhaseInput = {
  phaseId: string;
  phasePromptUserText: string; // prompt de la fase (user)
};

export type BuildMessagesInput = {
  settings: AgentSettings;
  business: BusinessContext;
  phase: PhaseInput;
  recentAssistantIntent?: string; // memoria breve opcional
};

/** Reglas Duras base (se ajustan dinámicamente con los controles) */
export const HARD_RULES_V1: AgentRulesConfig = {
  maxSentences: 2,
  includeConcreteExample: true,
  forbidLists: true,
  avoidJargon: true,
  ifMissingKeyData: "offerAlt",
  rulesVersion: "hard-rules-v1",
};

/** Estilos por sector (bundles de vocabulario/estructura — solo guía de tono) */
export const STYLE_PRESETS: Record<AgentStyleId, AgentStylePreset> = {
  style_clinic_v1: {
    id: "style_clinic_v1",
    persona: "Formal, profesional y empática. Transmite confianza clínica sin sonar fría.",
    vocabulary: ["tratamiento", "sesión", "evaluación previa", "resultados naturales", "agenda"],
    structure:
      "Frase 1: respuesta breve con un dato concreto si está en el Contexto. Frase 2: siguiente paso (reserva/WhatsApp).",
    samplePhrases: [
      "Ofrecemos higiene facial y otros tratamientos; dime qué horario te viene mejor.",
      "Si quieres, te reservo ahora o te envío WhatsApp con los huecos.",
    ],
  },
  style_restaurant_v1: {
    id: "style_restaurant_v1",
    persona: "Cálida, cercana y resolutiva. Orientada a disponibilidad y recomendación.",
    vocabulary: ["mesa", "turno", "especialidad", "disponibilidad", "reservar"],
    structure:
      "Frase 1: disponibilidad + recomendación (si existe en el Contexto). Frase 2: acción (confirmar mesa o canal).",
    samplePhrases: [
      "Tenemos disponibilidad y puedo sugerirte nuestra especialidad.",
      "¿Te la confirmo ahora o prefieres que te pase WhatsApp?",
    ],
  },
  style_hotel_v1: {
    id: "style_hotel_v1",
    persona: "Formal pero acogedora. Clara con políticas y upsell suave.",
    vocabulary: ["habitación doble", "desayuno incluido", "check-in", "late check-out", "tarifa"],
    structure:
      "Frase 1: disponibilidad/tarifa y política clave si están en el Contexto. Frase 2: upsell o siguiente paso.",
    samplePhrases: [
      "Podemos ofrecerte habitación doble; te cuento detalles si te encaja.",
      "¿La bloqueo ahora o te envío un resumen por WhatsApp?",
    ],
  },
};

/* -------------------------- Helpers de controles -------------------------- */

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function computeEffectiveRules(base: AgentRulesConfig, controls?: StyleControls): AgentRulesConfig {
  const r = { ...base };
  if (controls?.maxSentences) r.maxSentences = clamp(controls.maxSentences, 1, 4);
  if (typeof controls?.includeExample === "boolean") r.includeConcreteExample = controls.includeExample;
  // Política de incertidumbre
  r.ifMissingKeyData =
    controls?.uncertaintyPolicy === "admit_and_offer_next" ? "offerAlt" : base.ifMissingKeyData;
  return r;
}

function describePolarity(label: string, level: 0 | 1 | 2, values: [string, string, string]) {
  return `- ${label}: ${values[level]} (${level}).`;
}

function buildToneDescriptor(controls: Required<Pick<StyleControls, "formality" | "warmth" | "assertiveness">>) {
  const lines: string[] = [];
  lines.push("Ajusta tu tono según estos controles (0=bajo, 1=medio, 2=alto):");
  lines.push(describePolarity("Formalidad", controls.formality, ["cercano", "neutral", "formal"]));
  lines.push(describePolarity("Calidez", controls.warmth, ["seco", "neutral", "empático"]));
  lines.push(
    describePolarity("Asertividad", controls.assertiveness, [
      "informativo",
      "guía suave hacia el siguiente paso",
      "cierre con llamada a la acción breve",
    ])
  );
  return lines.join("\n");
}

/* --------------------------- Bloques de mensajes -------------------------- */

function buildHardRulesSystemBlock(rules: AgentRulesConfig): string {
  const lines: string[] = [];
  lines.push(
    `Eres un agente de voz que responde en lenguaje natural. Cumple SIEMPRE estas reglas duras (${rules.rulesVersion}):`
  );
  lines.push(`- Máximo ${rules.maxSentences} frases claras y breves.`);
  if (rules.includeConcreteExample)
    lines.push(`- Incluye exactamente 1 ejemplo concreto (precio, horario, turno, tratamiento o similar).`);
  if (rules.forbidLists) lines.push(`- Evita listas o viñetas; responde en frases corridas.`);
  if (rules.avoidJargon) lines.push(`- Evita tecnicismos; usa lenguaje cotidiano y cercano.`);
  lines.push(`- No inventes datos. Usa exclusivamente el “Contexto del negocio” para cifras/horarios/políticas.`);
  if (rules.ifMissingKeyData === "offerAlt")
    lines.push(`- Si falta un dato clave, dilo en 1 frase y ofrece un siguiente paso (p.ej., confirmar por WhatsApp).`);
  else lines.push(`- Si falta un dato clave, indícalo sin inventar ni alargar la respuesta.`);
  lines.push(`- La salida final debe poder usarse en TTS (sin símbolos raros) y sin emojis.`);
  return lines.join("\n");
}

function buildStyleSystemBlock(
  preset: AgentStylePreset,
  language: "es" | "en" = "es",
  controls?: StyleControls,
  closingQuestion?: boolean
): string {
  const formality = (controls?.formality ?? 1) as 0 | 1 | 2;
  const warmth = (controls?.warmth ?? 1) as 0 | 1 | 2;
  const assertiveness = (controls?.assertiveness ?? 1) as 0 | 1 | 2;
  const tone = buildToneDescriptor({ formality, warmth, assertiveness });

  const lines: string[] = [];
  lines.push(`Adopta este estilo (${preset.id}):`);
  lines.push(`- Persona: ${preset.persona}`);
  lines.push(`- Vocabulario preferente: ${preset.vocabulary.join(", ")}`);
  lines.push(`- Estructura (2 frases si es posible): ${preset.structure}`);
  lines.push(`- Frases tipo (solo guía de tono, NO datos reales): ${preset.samplePhrases.map((s) => `"${s}"`).join(" / ")}`);
  lines.push(tone);
  if (closingQuestion === true) {
    lines.push(`- Cierra con una pregunta breve y natural que facilite el siguiente paso.`);
  } else if (closingQuestion === false) {
    lines.push(`- No cierres con pregunta; deja la acción implícita de forma natural.`);
  }
  lines.push(`- Idioma de respuesta: ${language === "en" ? "English" : "Español"}.`);
  return lines.join("\n");
}

function buildBrandSafetyBlock(business: BusinessContext): string {
  const lines: string[] = [];
  lines.push(`Política de marca y seguridad:`);
  lines.push(`- No pidas datos sensibles innecesarios.`);
  lines.push(`- Sé claro y respetuoso. No compartas políticas internas.`);
  if (business.locale) lines.push(`- Usa formato local para horas/precios si corresponde (${business.locale}).`);
  return lines.join("\n");
}

function buildBusinessContextBlock(business: BusinessContext): string {
  const lines: string[] = [];
  lines.push(`Contexto del negocio:`);
  if (business.companyName) lines.push(`- Nombre: ${business.companyName}`);
  if (business.openingHoursText) lines.push(`- Horarios: ${business.openingHoursText}`);
  if (business.basePricesText) lines.push(`- Precios base: ${business.basePricesText}`);
  if (business.policiesText) lines.push(`- Políticas: ${business.policiesText}`);
  if (business.availabilityHint) lines.push(`- Disponibilidad: ${business.availabilityHint}`);
  return lines.join("\n");
}

function buildOutputContractInstruction(allowEmojis: "off" | "light" | "on"): string {
  return [
    `Devuelve SOLO un JSON válido con las claves:`,
    `- speak_text (string): respuesta final para TTS, con máximo 2 frases, SIN emojis.`,
    `- display_text (string, opcional): versión para chat; ${
      allowEmojis === "off"
        ? "no incluyas emojis."
        : allowEmojis === "light"
        ? "puedes incluir 1 emoji sutil si encaja naturalmente."
        : "puedes incluir emojis de forma natural (sin abusar)."
    }`,
    `- ssml (string, opcional): si usas SSML, envolviendo speak_text en <speak>...</speak>.`,
    `- used_style_id (string) y rules_version (string) para trazabilidad.`,
    `No incluyas explicaciones fuera del JSON.`,
  ].join("\n");
}

/* -------------------------- Builder principal ----------------------------- */

export function buildMessagesFromSettingsV2(input: BuildMessagesInput): {
  messages: LLMMessage[];
  used_style_id: AgentStyleId;
  rules_version: string;
  controls_used: Required<StyleControls>;
} {
  const { settings, business, phase, recentAssistantIntent } = input;

  // Controles con defaults seguros
  const controls: Required<StyleControls> = {
    maxSentences: clamp(settings.style?.controls?.maxSentences ?? HARD_RULES_V1.maxSentences, 1, 4),
    includeExample: settings.style?.controls?.includeExample ?? true,
    formality: (settings.style?.controls?.formality ?? 1) as 0 | 1 | 2,
    warmth: (settings.style?.controls?.warmth ?? 1) as 0 | 1 | 2,
    assertiveness: (settings.style?.controls?.assertiveness ?? 1) as 0 | 1 | 2,
    allowEmojis: settings.style?.controls?.allowEmojis ?? "off",
    uncertaintyPolicy: settings.style?.controls?.uncertaintyPolicy ?? "admit_and_offer_next",
  };

  // Reglas efectivas según controles
  const rules = computeEffectiveRules(HARD_RULES_V1, controls);

  // Estilo seleccionado
  const styleId: AgentStyleId = (settings.style?.preset as AgentStyleId) || "style_clinic_v1";
  const stylePreset = STYLE_PRESETS[styleId];
  const language = settings.style?.language || "es";
  const closingQuestion = settings.style?.closingQuestion;

  const systemHardRules: LLMMessage = { role: "system", content: buildHardRulesSystemBlock(rules) };
  const systemStyle: LLMMessage = {
    role: "system",
    content: buildStyleSystemBlock(stylePreset, language, controls, closingQuestion),
  };
  const systemBrandSafety: LLMMessage = { role: "system", content: buildBrandSafetyBlock(business) };
  const userBusinessContext: LLMMessage = { role: "user", content: buildBusinessContextBlock(business) };
  const assistantMemoryShort: LLMMessage | null = recentAssistantIntent
    ? { role: "assistant", content: `Resumen de la última intención detectada: ${recentAssistantIntent}` }
    : null;
  const userPhasePrompt: LLMMessage = {
    role: "user",
    content: `Fase=${phase.phaseId}. Petición del usuario: ${phase.phasePromptUserText}`,
  };
  const systemOutputContract: LLMMessage = {
    role: "system",
    content: buildOutputContractInstruction(controls.allowEmojis),
  };

  const messages: LLMMessage[] = [
    systemHardRules,
    systemStyle,
    systemBrandSafety,
    userBusinessContext,
    ...(assistantMemoryShort ? [assistantMemoryShort] : []),
    userPhasePrompt,
    systemOutputContract,
  ];

  return {
    messages,
    used_style_id: styleId,
    rules_version: rules.rulesVersion,
    controls_used: controls,
  };
}

/* ------------------------------ Post-proceso ------------------------------ */

export function trimToNSentences(text: string, n: number): string {
  if (!text) return text;
  const normalized = text.replace(/\s+/g, " ").trim();
  const parts = normalized.split(/(?<=[.!?])\s+/);
  const selected = parts.slice(0, Math.max(1, n)).join(" ");
  return selected || normalized;
}

export function hasConcreteExample(text: string): boolean {
  const patterns = [
    /\b\d+\s?(€|eur)\b/i,
    /\b\d{1,2}:\d{2}\b/,
    /\bhora(s)?\b/i,
    /\bturno\b/i,
    /\bdesde\s+\d+\s?(€|eur)\b/i,
  ];
  return patterns.some((re) => re.test(text));
}

function maybeAddEmoji(text: string, mode: "off" | "light" | "on") {
  if (mode === "off") return text;
  // Si ya hay emoji visible, no añadimos
  if (/\p{Extended_Pictographic}/u.test(text)) return text;
  const tail = mode === "light" ? " 🙂" : " 😊";
  // Evita duplicar punto final
  if (/[.!?]$/.test(text)) return text.replace(/[.!?]$/, (m) => `${m}${tail}`);
  return `${text}${tail}`;
}

export function buildOutputContract(opts: {
  rawText: string;
  rulesVersion: string;
  usedStyleId: AgentStyleId;
  allowEmojis?: "off" | "light" | "on";
  addSSML?: boolean;
  maxSentencesOverride?: number;
  requireExample?: boolean;
}) {
  const {
    rulesVersion,
    usedStyleId,
    allowEmojis = "off",
    addSSML,
    maxSentencesOverride,
    requireExample,
  } = opts;

  // 1) Recorte a N frases (controles o hard rules)
  const n = typeof maxSentencesOverride === "number" ? clamp(maxSentencesOverride, 1, 4) : HARD_RULES_V1.maxSentences;
  let speak_text = trimToNSentences(opts.rawText, n);

  // 2) Asegurar ejemplo concreto si se exige
  const mustExample = typeof requireExample === "boolean" ? requireExample : HARD_RULES_V1.includeConcreteExample;
  if (mustExample && !hasConcreteExample(speak_text)) {
    speak_text = `${speak_text} Puedo confirmarte el horario o precio exacto por WhatsApp ahora mismo.`;
    speak_text = trimToNSentences(speak_text, n);
  }

  // 3) display_text (emojis opcionales)
  let display_text = speak_text;
  display_text = maybeAddEmoji(display_text, allowEmojis);

  // 4) SSML opcional
  const ssml = addSSML ? `<speak>${escapeXml(speak_text)}</speak>` : undefined;

  return { speak_text, display_text, ssml, used_style_id: usedStyleId, rules_version: rulesVersion };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/* -------------------------- Retro-compat helpers -------------------------- */

export function buildMessagesFromSettings(input: BuildMessagesInput) {
  return buildMessagesFromSettingsV2(input);
}

/** Devuelve un saludo según hora/localización (ES/EN) y opcionalmente con nombre. */
export function computeGreeting(opts?: {
  timezone?: string;
  locale?: string;
  language?: "es" | "en";
  name?: string;
  date?: Date;
}): string {
  const tz = opts?.timezone || "Europe/Madrid";
  const locale = opts?.locale || "es-ES";
  const lang = opts?.language || (locale?.toLowerCase().startsWith("en") ? "en" : "es");
  const now = opts?.date ?? new Date();

  let hour = now.getHours();
  try {
    hour = Number(new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: false, timeZone: tz }).format(now));
  } catch { /* fallback local */ }

  const greet =
    lang === "en"
      ? hour < 12
        ? "Good morning"
        : hour < 20
        ? "Good afternoon"
        : "Good evening"
      : hour < 12
      ? "Buenos días"
      : hour < 20
      ? "Buenas tardes"
      : "Buenas noches";

  return opts?.name ? `${greet}, ${opts.name}` : greet;
}

/** Acorta nombres de empresa quitando sufijos legales comunes y dejando lo relevante. */
export function shortCompanyName(input?: string): string {
  if (!input) return "";
  let s = input.trim();

  const SUFFIXES = [
    "s.l.", "sl", "s.a.", "sa", "ltda", "ltd.", "ltd", "llc", "inc.", "inc", "gmbh",
    "sociedad limitada", "sociedad anónima", "sociedad anonima", "co.", "co", "corp", "corporation", "company",
  ];

  for (const suf of SUFFIXES) {
    const re = new RegExp(`\\b${suf}$`, "i");
    s = s.replace(re, "").trim();
  }

  s = s.replace(/\s{2,}/g, " ").trim();
  const words = s.split(/\s+/);
  if (words.length > 3 || s.length > 24) s = words.slice(-2).join(" ");
  return s;
}

/** Renderizado de plantillas simples */
export function renderTemplate(tpl: string, vars: Record<string, any> = {}): string {
  if (!tpl) return "";
  return tpl.replace(/{{\s*([\w.]+)\s*}}/g, (_m, path: string) => {
    const value = path.split(".").reduce<any>((acc, key) => (acc != null ? acc[key] : undefined), vars);
    return value == null ? "" : String(value);
  });
}

/** (Opcional) Mapear tu Knowledge → BusinessContext */
export function buildBusinessContextFromKnowledge(knowledge: Record<string, any>): BusinessContext {
  return {
    companyName: knowledge.companyName || knowledge.name || knowledge.tradeName,
    openingHoursText: knowledge.openingHoursText || knowledge.hours || knowledge.schedule,
    basePricesText: knowledge.basePricesText || knowledge.prices,
    policiesText: knowledge.policiesText || knowledge.policies,
    availabilityHint: knowledge.availabilityHint,
    timezone: knowledge.timezone,
    locale: knowledge.locale,
    brandVoiceAllowedEmojis: knowledge.brandVoiceAllowedEmojis,
  };
}
