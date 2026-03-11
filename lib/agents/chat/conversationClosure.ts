import { clearSessionStateMemory } from "@/lib/agents/memory/updateSessionMemory";

function normalize(text: string): string {
  return String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesOneOf(text: string, variants: string[]): boolean {
  for (const variant of variants) {
    if (text.includes(variant)) {
      return true;
    }
  }

  return false;
}

export type ConversationClosureResult = {
  shouldClose: boolean;
};

export function classifyConversationClosure(text: string): ConversationClosureResult {
  const t = normalize(text);

  if (!t) {
    return {
      shouldClose: false,
    };
  }

  const directClosers = [
    "no",
    "nop",
    "no gracias",
    "nada mas",
    "nada más",
    "eso es todo",
    "ya esta",
    "ya está",
    "listo",
    "perfecto",
    "ok",
    "vale",
    "gracias",
    "muchas gracias",
  ];

  for (const value of directClosers) {
    if (t === normalize(value)) {
      return {
        shouldClose: true,
      };
    }
  }

  if (
    includesOneOf(t, [
      "eso es todo",
      "nada mas",
      "nada más",
      "no gracias",
      "muchas gracias",
      "gracias",
      "ya esta",
      "ya está",
    ])
  ) {
    return {
      shouldClose: true,
    };
  }

  return {
    shouldClose: false,
  };
}

export async function closeConversationContext(args: {
  sessionId: string;
}): Promise<void> {
  await clearSessionStateMemory({
    sessionId: args.sessionId,
  });
}