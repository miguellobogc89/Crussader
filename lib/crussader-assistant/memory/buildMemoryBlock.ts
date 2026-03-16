// lib/crussader-assistant/memory/buildMemoryBlock.ts

import type { ConversationFact } from "./loadConversationFacts";

export function buildMemoryBlock(facts: ConversationFact[]): string {

  if (!facts.length) {
    return "No hay memoria relevante del usuario.";
  }

  const lines = facts.map((f) => `- ${f.fact_text}`);

  return `
MEMORIA DEL USUARIO
${lines.join("\n")}
`;
}