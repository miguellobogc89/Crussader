// lib/crussader-assistant/intake/detectTurnType.ts
import { TurnType } from "./types";

type DetectTurnTypeInput = {
  rawUserText: string;
  hasPendingState: boolean;
};

type DetectTurnTypeResult = {
  turnType: TurnType;
  dependsOnPreviousTurn: boolean;
};

const SHORT_REPLY_PATTERNS = [
  "sí",
  "si",
  "no",
  "vale",
  "ok",
  "okay",
  "perfecto",
  "claro",
  "correcto",
  "eso",
  "esa",
  "ese",
  "mejor",
  "por la mañana",
  "por la tarde",
  "por la noche"
];

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function isShortReply(text: string): boolean {
  const normalized = normalizeText(text);

  if (!normalized) {
    return false;
  }

  if (SHORT_REPLY_PATTERNS.includes(normalized)) {
    return true;
  }

  if (normalized.length <= 12) {
    return true;
  }

  return false;
}

function looksLikeOnlyTimeOrDate(text: string): boolean {
  const normalized = normalizeText(text);

  if (!normalized) {
    return false;
  }

  const timeRegex = /^a?\s*las?\s+\d{1,2}(:\d{2})?$/;
  const hourOnlyRegex = /^\d{1,2}(:\d{2})?$/;
  const dateKeywordRegex =
    /^(hoy|mañana|manana|pasado mañana|pasado manana|el lunes|el martes|el miércoles|el miercoles|el jueves|el viernes|el sábado|el sabado|el domingo)$/;

  if (timeRegex.test(normalized)) {
    return true;
  }

  if (hourOnlyRegex.test(normalized)) {
    return true;
  }

  if (dateKeywordRegex.test(normalized)) {
    return true;
  }

  return false;
}

export function detectTurnType(
  input: DetectTurnTypeInput
): DetectTurnTypeResult {
  if (!input.hasPendingState) {
    return {
      turnType: "NEW_REQUEST",
      dependsOnPreviousTurn: false
    };
  }

  if (looksLikeOnlyTimeOrDate(input.rawUserText)) {
    return {
      turnType: "ANSWER_TO_CLARIFICATION",
      dependsOnPreviousTurn: true
    };
  }

  if (isShortReply(input.rawUserText)) {
    return {
      turnType: "FOLLOW_UP",
      dependsOnPreviousTurn: true
    };
  }

  return {
    turnType: "NEW_REQUEST",
    dependsOnPreviousTurn: false
  };
}
