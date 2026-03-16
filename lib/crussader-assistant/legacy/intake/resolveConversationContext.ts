// lib/crussader-assistant/intake/resolveConversationContext.ts
import { detectTurnType } from "./detectTurnType";
import { IntakeSession, IntakeSessionStatus } from "./types";

type ResolveConversationContextInput = {
  rawUserText: string;
  hasPendingState: boolean;
  sessionId?: string | null;
  referencedTurnIds?: string[];
};

function resolveSessionStatus(
  hasPendingState: boolean,
  dependsOnPreviousTurn: boolean
): IntakeSessionStatus {
  if (hasPendingState) {
    if (dependsOnPreviousTurn) {
      return "WAITING_CLARIFICATION";
    }

    return "OPEN";
  }

  return "OPEN";
}

export function resolveConversationContext(
  input: ResolveConversationContextInput
): IntakeSession {
  const turnDetection = detectTurnType({
    rawUserText: input.rawUserText,
    hasPendingState: input.hasPendingState
  });

  let referencedTurnIds: string[] = [];

  if (input.referencedTurnIds) {
    referencedTurnIds = input.referencedTurnIds;
  }

  const status = resolveSessionStatus(
    input.hasPendingState,
    turnDetection.dependsOnPreviousTurn
  );

  let sessionId: string | null = null;

  if (input.sessionId !== undefined) {
    sessionId = input.sessionId;
  }

  return {
    sessionId,
    status,
    turnType: turnDetection.turnType,
    dependsOnPreviousTurn: turnDetection.dependsOnPreviousTurn,
    referencedTurnIds
  };
}
