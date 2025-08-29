export type Tone = "cordial" | "formal" | "cercano";
export type Language = "es" | "en";
export type TemplateId = "default-v1" | "breve-v1" | "disculpas-v1";

export type TemplateInput = {
  rating: number;
  comment?: string | null;
  reviewerName?: string | null;
  businessName?: string | null;
  locationName?: string | null;
  tone: Tone;
  lang: Language;
};

export type AIOptions = {
  templateId?: TemplateId;
  provider?: "openai";
  maxTokens?: number;
};
