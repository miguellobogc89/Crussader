// /app/dashboard/voiceagent/_types.ts
export type AgentSettings = {
  version?: number;
  llm: { model: string; temperature: number; maxTokens: number };
  style: { language?: string; persona: string; suggestMaxSlots: number; closingQuestion: boolean };
  nlu?: { services?: Record<string, string[]>; actions?: Record<string, string[]> };
  flow: {
    identify: {
      system?: string;
      assistantPrompt: string;            // ← aquí guardamos el TEMPLATE (no el render)
      missingNameFollowup?: string;
      missingPhoneFollowup?: string;
    };
    intent: { system?: string; assistantPrompt: string };
    servicePipelines?: Record<
      string,
      { checklist?: string[]; proposeStrategy?: { type?: string; maxSlots?: number; prefer?: string }; confirmPrompt?: string }
    >;
    fallback: { firstRetry: string; secondRetry: string; leaveCommentTemplate?: string };
  };
  [k: string]: any;
};

export type PartialSettings = Partial<AgentSettings>;