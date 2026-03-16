// lib/crussader-assistant/intake/createBaseIntakePacket.ts
import { buildIntakePacket } from "./buildIntakePacket";
import { resolveConversationContext } from "./resolveConversationContext";
import { IntakeFeedback, IntakePacket } from "./types";

type CreateBaseIntakePacketInput = {
  rawUserText: string;
  hasPendingState: boolean;
  sessionId?: string | null;
  referencedTurnIds?: string[];
  requestedNeed?: string | null;
  product?: string | null;
  subtype?: string | null;
  confidence?: number;
  needsClarification?: boolean;
  clarificationQuestion?: string | null;
  feedback?: IntakeFeedback | null;
  data?: Record<string, unknown>;
  missingFields?: string[];
};

function resolveConfidenceLevel(confidence: number) {
  if (confidence >= 0.8) {
    return "HIGH";
  }

  if (confidence >= 0.5) {
    return "MEDIUM";
  }

  return "LOW";
}

function resolveSessionStatusFromUnderstanding(
  needsClarification: boolean,
  missingFields: string[]
) {
  if (needsClarification) {
    return "WAITING_CLARIFICATION";
  }

  if (missingFields.length > 0) {
    return "WAITING_CLARIFICATION";
  }

  return "READY";
}

export function createBaseIntakePacket(
  input: CreateBaseIntakePacketInput
): IntakePacket {
  const session = resolveConversationContext({
    rawUserText: input.rawUserText,
    hasPendingState: input.hasPendingState,
    sessionId: input.sessionId,
    referencedTurnIds: input.referencedTurnIds
  });

  let confidence = 0.3;

  if (input.confidence !== undefined) {
    confidence = input.confidence;
  }

  let requestedNeed: string | null = null;

  if (input.requestedNeed !== undefined) {
    requestedNeed = input.requestedNeed;
  }

  let product: string | null = null;

  if (input.product !== undefined) {
    product = input.product;
  }

  let subtype: string | null = null;

  if (input.subtype !== undefined) {
    subtype = input.subtype;
  }

  let needsClarification = false;

  if (input.needsClarification !== undefined) {
    needsClarification = input.needsClarification;
  }

  let clarificationQuestion: string | null = null;

  if (input.clarificationQuestion !== undefined) {
    clarificationQuestion = input.clarificationQuestion;
  }

  let missingFields: string[] = [];

  if (input.missingFields) {
    missingFields = input.missingFields;
  }

  session.status = resolveSessionStatusFromUnderstanding(
    needsClarification,
    missingFields
  );

  let data: Record<string, unknown> = {};

  if (input.data) {
    data = input.data;
  }

  let feedback: IntakeFeedback | null = null;

  if (input.feedback !== undefined) {
    feedback = input.feedback;
  }

  return buildIntakePacket({
    rawUserText: input.rawUserText,
    session,
    understanding: {
      requestedNeed,
      product,
      subtype,
      confidence,
      confidenceLevel: resolveConfidenceLevel(confidence),
      needsClarification,
      clarificationQuestion
    },
    data,
    missingFields,
    feedback
  });
}
