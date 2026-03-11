// lib/agents/stages/types.ts

export type StageName = "RECOGNITION";

export type CustomerScope = "NONE" | "EXISTS_OTHER_COMPANY" | "KNOWN_THIS_COMPANY";

export type StageOutcome =
  | { kind: "CONTINUE" } // deja pasar al LLM/libre o al siguiente stage
  | { kind: "BLOCK_AND_REPLY"; botText: string } // corta aquí y responde
  | { kind: "ERROR"; error: string };

export type StageContext = {
  companyId: string;
  conversationId: string;
  phoneE164: string; // normalizado (solo dígitos)
  incomingText: string;
  whatsappContactName: string | null; // display name NO verificado
};

export type StageResult = {
  stage: StageName;
  scope: CustomerScope;
  outcome: StageOutcome;
  debug?: Record<string, unknown>;
};