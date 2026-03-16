// lib/crussader-assistant/memory/extractConversationFacts.ts
export type ExtractedFact = {
  type: string;
  text: string;
};

export function extractConversationFacts(text: string): ExtractedFact[] {

  const facts: ExtractedFact[] = [];

  const lower = text.toLowerCase();

  if (lower.includes("buen día") || lower.includes("buen dia")) {
    facts.push({
      type: "EMOTIONAL_CONTEXT",
      text: "El usuario ha tenido un buen día"
    });
  }

  if (lower.includes("mal día") || lower.includes("mal dia")) {
    facts.push({
      type: "EMOTIONAL_CONTEXT",
      text: "El usuario ha tenido un mal día"
    });
  }

  if (lower.includes("me ha tocado la lotería") || lower.includes("me ha tocado la loteria")) {
    facts.push({
      type: "POSITIVE_EVENT",
      text: "Al usuario le ha tocado la lotería"
    });
  }

  if (lower.includes("me encantan los barcos")) {
    facts.push({
      type: "USER_PREFERENCE",
      text: "Al usuario le encantan los barcos"
    });
  }

  return facts;
}