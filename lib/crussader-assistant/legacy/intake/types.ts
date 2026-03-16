// lib/crussader-assistant/intake/types.ts
export type TurnType =
  | "NEW_REQUEST"
  | "FOLLOW_UP"
  | "ANSWER_TO_CLARIFICATION";

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export type IntakeSessionStatus =
  | "OPEN"
  | "WAITING_CLARIFICATION"
  | "READY"
  | "RESOLVED"
  | "ABANDONED";

export type IntakeSession = {
  sessionId: string | null;
  status: IntakeSessionStatus;
  turnType: TurnType;
  dependsOnPreviousTurn: boolean;
  referencedTurnIds: string[];
};

export type IntakeUnderstanding = {
  requestedNeed: string | null;
  product: string | null;
  subtype: string | null;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  needsClarification: boolean;
  clarificationQuestion: string | null;
};

export type IntakeEntities = {
  rawDateExpressions: string[];
  rawTimeExpressions: string[];
  rawRecurrenceExpressions: string[];
  rawTopics: string[];
  rawPeople: string[];
  rawLocations: string[];
};

export type IntakeFeedback = {
  sentiment: "NEGATIVE" | "NEUTRAL" | "POSITIVE";
  topic: string | null;
  urgency: "LOW" | "MEDIUM" | "HIGH" | null;
};

export type IntakeMemoryUsage = {
  usedProfileFields: string[];
  usedStateFields: string[];
  pendingStateDetected: boolean;
};

export type IntakeRoutingSuggestion = {
  targetModule: string | null;
  targetAction: string | null;
};

export type IntakePacket = {
  rawUserText: string;
  rewrittenUserText: string;
  session: IntakeSession;
  understanding: IntakeUnderstanding;
  entities: IntakeEntities;
  data: Record<string, unknown>;
  missingFields: string[];
  feedback: IntakeFeedback | null;
  memory: IntakeMemoryUsage;
  routing: IntakeRoutingSuggestion;
};

export type BuildIntakePacketInput = {
  rawUserText: string;
  rewrittenUserText?: string;
  session: IntakeSession;
  understanding: IntakeUnderstanding;
  entities?: Partial<IntakeEntities>;
  data?: Record<string, unknown>;
  missingFields?: string[];
  feedback?: IntakeFeedback | null;
  memory?: Partial<IntakeMemoryUsage>;
  routing?: Partial<IntakeRoutingSuggestion>;
};
