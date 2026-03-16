// lib/crussader-assistant/memory/loadConversationFacts.ts

import { prisma } from "@/lib/prisma";

export type ConversationFact = {
  fact_type: string;
  fact_text: string;
  confidence: number;
};

export async function loadConversationFacts(
  conversationId: string,
  limit: number = 10
): Promise<ConversationFact[]> {

  const rows = await prisma.$queryRawUnsafe<ConversationFact[]>(
    `
    SELECT fact_type, fact_text, confidence
    FROM assistant_conversation_fact
    WHERE conversation_id = $1::uuid
    ORDER BY created_at DESC
    LIMIT $2
    `,
    conversationId,
    limit
  );

  return rows;
}