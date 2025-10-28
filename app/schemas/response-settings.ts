// app/schemas/response-settings.ts
import { z } from "zod";

// Sub-schema para CTA por bucket
const CTAConfigSchema = z.object({
  channel: z.enum(["whatsapp", "phone", "email", "web"]),
  contact: z.string().optional(),
  text: z.string().max(300),
});

export const ResponseSettingsSchema = z.object({
  sector: z.string(),
  treatment: z.enum(["tu", "usted"]),
  tone: z.number().int().min(0).max(5),
  emojiIntensity: z.number().int().min(0).max(3),
  standardSignature: z.string(),
  language: z.enum(["es", "pt", "en"]),
  autoDetectLanguage: z.boolean(),

  starSettings: z.object({
    "1-2": z.object({
      objective: z.string(),
      length: z.number().int().min(0).max(2),
      enableCTA: z.boolean(),
    }),
    "3": z.object({
      objective: z.string(),
      length: z.number().int().min(0).max(2),
      enableCTA: z.boolean(),
    }),
    "4-5": z.object({
      objective: z.string(),
      length: z.number().int().min(0).max(2),
      enableCTA: z.boolean(),
    }),
  }),

  preferredChannel: z.enum(["whatsapp", "phone", "email", "web"]),
  ctaByRating: z.object({
    "1-2": CTAConfigSchema,
    "3": CTAConfigSchema,
    "4-5": CTAConfigSchema,
  }),
  showCTAWhen: z.enum(["always", "below3", "above4", "never"]),
  addUTM: z.boolean(),
  bannedPhrases: z.array(z.string()),
  noPublicCompensation: z.boolean(),
  avoidPersonalData: z.boolean(),

  publishMode: z.enum(["draft", "auto"]),
  autoPublishThreshold: z.enum(["3stars", "4stars", "5stars"]),
  variantsToGenerate: z.number().int().min(1).max(3),
  selectionMode: z.enum(["auto", "manual"]),
  model: z.enum(["gpt-4o", "gpt-4o-mini"]),
  creativity: z.number().min(0).max(1),
  maxCharacters: z.number().int().min(100).max(1000),

  notificationChannel: z.enum(["email", "whatsapp", "sms"]),
  notificationContact: z.string(),
});

export type ResponseSettings = z.infer<typeof ResponseSettingsSchema>;
export type CTAConfig = z.infer<typeof CTAConfigSchema>;
