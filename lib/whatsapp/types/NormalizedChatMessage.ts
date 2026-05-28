// lib/whatsapp/types/NormalizedChatMessage.ts

export type NormalizedChatMessageDirection = "in" | "out";

export type NormalizedChatMessageKind =
  | "text"
  | "button"
  | "interactive"
  | "template"
  | "unknown";

export type NormalizedChatMessage = {
  direction: NormalizedChatMessageDirection;
  kind: NormalizedChatMessageKind;
  providerMessageId: string | null;
  displayText: string;
  providerTs: Date;
  status: string | null;
  payload: unknown;
};