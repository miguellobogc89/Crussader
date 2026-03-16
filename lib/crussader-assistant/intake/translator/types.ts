// lib/crussader-assistant/translator/types.ts
export type TranslatorResult = {
  rewrittenUserText: string;
  requestedInstruction: string | null;
  action: string | null;
  product: string | null;
  subtype: string | null;
  confidence: number;
  data: Record<string, unknown>;
  missingFields: string[];
};

export type TranslateUserIntentInput = {
  rawUserText: string;
  previousMessages: Array<{
    role: "user" | "assistant";
    text: string;
  }>;
  availableInstructions: string[];
  availableActions: string[];
  availableProducts: string[];
  availableSubtypes: string[];
};

export type TranslatorJsonSchema = {
  rewrittenUserText: string;
  requestedInstruction: string | null;
  action: string | null;
  product: string | null;
  subtype: string | null;
  confidence: number;
  data: Record<string, unknown>;
  missingFields: string[];
};
