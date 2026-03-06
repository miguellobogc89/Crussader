// lib/agents/chat/simpleMessageClassifier.ts
export type SimpleMessageResult =
  | { kind: "ACK"; reply: string }
  | { kind: "GREETING"; reply: string }
  | { kind: "REAL_MESSAGE" };

function normalize(text: string): string {
  return String(text || "").trim().toLowerCase();
}

export function classifySimpleMessage(text: string): SimpleMessageResult {
  const t = normalize(text);

  // ACKs muy comunes
  const acks = [
    "ok",
    "vale",
    "perfecto",
    "gracias",
    "muchas gracias",
    "👍",
    "👌",
    "si",
    "sí",
  ];

  if (acks.includes(t)) {
    return {
      kind: "ACK",
      reply: "Perfecto 👍",
    };
  }

  // saludos simples
  const greetings = [
    "hola",
    "buenos dias",
    "buenos días",
    "buenas",
    "buenas tardes",
    "buenas noches",
  ];

  if (greetings.includes(t)) {
    return {
      kind: "GREETING",
      reply: "Hola 👋 ¿En qué puedo ayudarte?",
    };
  }

  return { kind: "REAL_MESSAGE" };
}