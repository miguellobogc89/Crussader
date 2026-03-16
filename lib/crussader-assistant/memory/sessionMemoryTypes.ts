// lib/crussader-assistant/memory/sessionMemoryTypes.ts
export type PendingIntentStatus =
  | "OPEN"
  | "WAITING_FOR_DATA"
  | "READY"
  | "COMPLETED"
  | "ABANDONED";

export type PendingIntent = {
  requestedInstruction: string | null;
  action: string | null;
  product: string | null;
  subtype: string | null;
  status: PendingIntentStatus;
  collectedData: Record<string, unknown>;
  missingFields: string[];
};

export type SessionContext = {
  lastAssistantQuestion: string | null;
  lastUserMessages: string[];
};

export type SessionStateMemory = {
  pendingIntent: PendingIntent | null;
  context: SessionContext;
};
