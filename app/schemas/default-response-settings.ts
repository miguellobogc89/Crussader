// app/schemas/default-response-settings.ts
import type { ResponseSettings } from "./response-settings";

export const defaultResponseSettings: ResponseSettings = {
  businessName: "",
  sector: "",
  treatment: "tu",
  tone: 2,
  emojiIntensity: 1,
  standardSignature: "",
  language: "es",
  autoDetectLanguage: true,

  starSettings: {
    "1-2": { objective: "apology", length: 1, enableCTA: true },
    "3": { objective: "neutral", length: 1, enableCTA: true },
    "4-5": { objective: "thanks", length: 1, enableCTA: true },
  },

  ctaByRating: {
    "1-2": { channel: "whatsapp", text: "", contact: "" },
    "3": { channel: "email", text: "", contact: "" },
    "4-5": { channel: "web", text: "", contact: "" },
  },

  preferredChannel: "web",
  showCTAWhen: "always",
  addUTM: true,

  bannedPhrases: [],
  noPublicCompensation: true,
  avoidPersonalData: true,

  publishMode: "draft",
  autoPublishThreshold: "4stars",
  variantsToGenerate: 1,
  selectionMode: "manual",
  model: "gpt-4o",
  creativity: 0.7,
  maxCharacters: 500,
  notificationChannel: "email",
  notificationContact: "",
};
