// /app/dashboard/voiceagent/actions.ts
"use server";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

/** Valores permitidos (internos; no exportar en "use server") */
const STYLE_PRESET_VALUES = ["style_clinic_v1", "style_restaurant_v1", "style_hotel_v1"] as const;
const ALLOW_EMOJIS_VALUES = ["off", "light", "on"] as const;
const UNCERTAINTY_POLICY_VALUES = ["admit_and_offer_next"] as const;
const VOICE_GENDER_VALUES = ["male", "female", "mixed"] as const;

type StylePreset = (typeof STYLE_PRESET_VALUES)[number];
type AllowEmojis = (typeof ALLOW_EMOJIS_VALUES)[number];
type UncertaintyPolicy = (typeof UNCERTAINTY_POLICY_VALUES)[number];
type VoiceGender = (typeof VOICE_GENDER_VALUES)[number];

type StyleControls = {
  maxSentences?: number;            // 1..4
  includeExample?: boolean;         // exigir ejemplo concreto si hay datos
  formality?: 0 | 1 | 2;            // 0=cercano 1=neutral 2=formal
  warmth?: 0 | 1 | 2;               // 0=seco 1=neutral 2=empático
  assertiveness?: 0 | 1 | 2;        // 0=informativo 1=guía 2=cierre/CTA
  allowEmojis?: AllowEmojis;        // off | light | on  (solo display_text)
  uncertaintyPolicy?: UncertaintyPolicy; // estrategia ante falta de datos
};

type AgentSettingsObject = {
  style?: {
    preset?: StylePreset | string;
    language?: "es" | "en" | string;
    persona?: string;
    suggestMaxSlots?: number;
    closingQuestion?: boolean;
    controls?: StyleControls;
    voice?: {
      gender?: VoiceGender;
      [k: string]: any;
    };
    [k: string]: any;
  };
  llm?: { model?: string; temperature?: number; maxTokens?: number };
  [k: string]: any;
};

/** Defaults */
const DEFAULT_STYLE: { preset: StylePreset; language: "es" | "en" } = {
  preset: "style_clinic_v1",
  language: "es",
};
const DEFAULT_CONTROLS: Required<StyleControls> = {
  maxSentences: 2,
  includeExample: true,
  formality: 1,
  warmth: 1,
  assertiveness: 1,
  allowEmojis: "off",
  uncertaintyPolicy: "admit_and_offer_next",
};
const DEFAULT_VOICE: { gender: VoiceGender } = {
  gender: "mixed",
};

/** Utils */
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Zod schema de settings del agente (añadimos style.controls y style.voice) */
const AgentSettingsSchema = z
  .object({
    version: z.number().optional(),
    llm: z
      .object({
        model: z.string().optional(),
        temperature: z.number().optional(),
        maxTokens: z.number().optional(),
      })
      .optional(),
    style: z
      .object({
        preset: z.enum(STYLE_PRESET_VALUES).optional(),
        language: z.enum(["es", "en"]).optional(),
        persona: z.string().optional(),
        suggestMaxSlots: z.number().optional(),
        closingQuestion: z.boolean().optional(),
        controls: z
          .object({
            maxSentences: z.number().int().min(1).max(4).optional(),
            includeExample: z.boolean().optional(),
            formality: z.number().int().min(0).max(2).optional(),
            warmth: z.number().int().min(0).max(2).optional(),
            assertiveness: z.number().int().min(0).max(2).optional(),
            allowEmojis: z.enum(ALLOW_EMOJIS_VALUES).optional(),
            uncertaintyPolicy: z.enum(UNCERTAINTY_POLICY_VALUES).optional(),
          })
          .optional(),
        voice: z
          .object({
            gender: z.enum(VOICE_GENDER_VALUES).optional(),
          })
          .optional(),
      })
      .optional(),
    nlu: z
      .object({
        services: z.record(z.string(), z.array(z.string())).optional(),
        actions: z.record(z.string(), z.array(z.string())).optional(),
      })
      .optional(),
    flow: z
      .object({
        identify: z
          .object({
            system: z.string().optional(),
            assistantPrompt: z.string().optional(),
            missingNameFollowup: z.string().optional(),
            missingPhoneFollowup: z.string().optional(),
          })
          .optional(),
        intent: z
          .object({
            system: z.string().optional(),
            assistantPrompt: z.string().optional(),
          })
          .optional(),
        servicePipelines: z
          .record(
            z.string(),
            z.object({
              checklist: z.array(z.string()).optional(),
              proposeStrategy: z
                .object({
                  type: z.string().optional(),
                  maxSlots: z.number().optional(),
                  prefer: z.string().optional(),
                })
                .optional(),
              confirmPrompt: z.string().optional(),
            })
          )
          .optional(),
        fallback: z
          .object({
            firstRetry: z.string().optional(),
            secondRetry: z.string().optional(),
            leaveCommentTemplate: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

/** Normaliza settings aplicando defaults seguros (no pisa otras claves) */
function normalizeAgentSettings<S extends AgentSettingsObject>(s: S): S {
  const out = { ...s } as AgentSettingsObject;

  // Asegurar bloque style
  if (!out.style || typeof out.style !== "object") out.style = {};

  // preset válido o default
  if (!STYLE_PRESET_VALUES.includes(out.style.preset as StylePreset)) {
    out.style.preset = DEFAULT_STYLE.preset;
  }

  // language válido o default
  if (out.style.language !== "es" && out.style.language !== "en") {
    out.style.language = DEFAULT_STYLE.language;
  }

  // Controles: completar y sanear
  const c = out.style.controls ?? {};
  const sane: Required<StyleControls> = {
    maxSentences:
      typeof c.maxSentences === "number" ? clamp(c.maxSentences, 1, 4) : DEFAULT_CONTROLS.maxSentences,
    includeExample: typeof c.includeExample === "boolean" ? c.includeExample : DEFAULT_CONTROLS.includeExample,
    formality:
      typeof c.formality === "number" ? (clamp(c.formality, 0, 2) as 0 | 1 | 2) : DEFAULT_CONTROLS.formality,
    warmth:
      typeof c.warmth === "number" ? (clamp(c.warmth, 0, 2) as 0 | 1 | 2) : DEFAULT_CONTROLS.warmth,
    assertiveness:
      typeof c.assertiveness === "number"
        ? (clamp(c.assertiveness, 0, 2) as 0 | 1 | 2)
        : DEFAULT_CONTROLS.assertiveness,
    allowEmojis: ALLOW_EMOJIS_VALUES.includes(c.allowEmojis as AllowEmojis)
      ? (c.allowEmojis as AllowEmojis)
      : DEFAULT_CONTROLS.allowEmojis,
    uncertaintyPolicy: UNCERTAINTY_POLICY_VALUES.includes(c.uncertaintyPolicy as UncertaintyPolicy)
      ? (c.uncertaintyPolicy as UncertaintyPolicy)
      : DEFAULT_CONTROLS.uncertaintyPolicy,
  };
  out.style.controls = sane;

  // Voz: completar y sanear
  const v = out.style.voice ?? {};
  const gender: VoiceGender = VOICE_GENDER_VALUES.includes(v.gender as VoiceGender)
    ? (v.gender as VoiceGender)
    : DEFAULT_VOICE.gender;
  out.style.voice = { ...v, gender };

  return out as S;
}

/** === Actions (únicos exports permitidos) === */
export async function loadAgentSettings(companyId: string) {
  if (!companyId) throw new Error("companyId requerido");
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, agentSettings: true },
  });

  const raw = (company?.agentSettings ?? {}) as AgentSettingsObject;
  const withDefaults = normalizeAgentSettings(raw);
  return withDefaults;
}

export async function saveAgentSettings(companyId: string, settings: unknown) {
  if (!companyId) throw new Error("companyId requerido");

  const parsed = AgentSettingsSchema.safeParse(settings);
  if (!parsed.success) throw new Error("agentSettings inválidos");

  const normalized = normalizeAgentSettings(parsed.data as AgentSettingsObject);

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: { agentSettings: normalized as any },
    select: { id: true },
  });

  return { ok: true, id: updated.id };
}

/** Para mostrar el nombre de la empresa en la UI */
export async function loadCompanyMeta(companyId: string) {
  if (!companyId) throw new Error("companyId requerido");
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true },
  });
  if (!company) return null;
  return { id: company.id, name: company.name };
}
