// lib/crussader-assistant/memory/logConversationFact.ts

import { prisma } from "@/lib/prisma";

type Args = {
  conversationId: string;
  factType: string;
  factText: string;
  confidence?: number;
};

export async function logConversationFact(args: Args) {

  const {
    conversationId,
    factType,
    factText,
    confidence = 1
  } = args;

  const existing = await prisma.$queryRawUnsafe<
    { id: string }[]
  >(
    `
    SELECT id
    FROM assistant_conversation_fact
    WHERE conversation_id = $1::uuid
    AND fact_type = $2
    AND fact_text = $3
    ORDER BY created_at DESC
    LIMIT 1
    `,
    conversationId,
    factType,
    factText
  );

  if (existing.length > 0) {
    return;
  }

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO assistant_conversation_fact
    (
      conversation_id,
      fact_type,
      fact_text,
      confidence
    )
    VALUES ($1::uuid,$2,$3,$4)
    `,
    conversationId,
    factType,
    factText,
    confidence
  );
}