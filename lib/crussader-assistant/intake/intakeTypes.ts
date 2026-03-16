// lib/crussader-assistant/intake/intakeTypes.ts
import type { IntakeCapabilityKey } from "./intakeCatalog";

export type IntakeInteractionMode =
  | "CONVERSATION"
  | "TASK_DETECTED"
  | "TASK_DATA_CONTINUATION"
  | "TASK_CANCEL"
  | "TASK_CONFIRM"
  | "UNCLEAR";

export type IntakeTaskStatus =
  | "NONE"
  | "COLLECTING"
  | "READY";

export type IntakeTranslatorResult = {
  rewrittenUserText: string;
  interactionMode: IntakeInteractionMode;
  detectedCapability: IntakeCapabilityKey | null;

  detectedCatalogCapabilityKey: string | null;
  detectedCatalogActionKey: string | null;
  detectedCatalogProductKey: string | null;
  detectedCatalogItemKey: string | null;

  confidence: number;
  data: Record<string, unknown>;
  missingFields: string[];
  userGoal: string | null;
};

export type PendingTask = {
  capability: IntakeCapabilityKey;
  status: IntakeTaskStatus;
  collectedData: Record<string, unknown>;
  missingFields: string[];
  userGoal: string | null;
};

export type IntakeMemoryState = {
  pendingTask: PendingTask | null;
  context: {
    lastAssistantMessage: string | null;
    lastUserMessages: string[];
    conversationIntentData?: Record<string, unknown>;
  };
};

export type IntakeReplyDecision =
  | {
      type: "CONVERSATION";
      userMessage: string;
      rewrittenUserText: string;
      memoryState: IntakeMemoryState;
    }
  | {
      type: "ASK_FOR_MISSING_FIELDS";
      capability: IntakeCapabilityKey;
      collectedData: Record<string, unknown>;
      missingFields: string[];
      userGoal: string | null;
      memoryState: IntakeMemoryState;
    }
  | {
      type: "TASK_READY";
      capability: IntakeCapabilityKey;
      collectedData: Record<string, unknown>;
      userGoal: string | null;
      memoryState: IntakeMemoryState;
    }
  | {
      type: "UNCLEAR";
      userMessage: string;
      rewrittenUserText: string;
      memoryState: IntakeMemoryState;
    };

export type RunAssistantIntakeInput = {
  conversationId: string;
  rawUserText: string;
};

export type RunAssistantIntakeResult = {
  botText: string;
  replyDecision: IntakeReplyDecision;
  memoryState: IntakeMemoryState;
  translatorResult: IntakeTranslatorResult;
  readyTask: PendingTask | null;
};