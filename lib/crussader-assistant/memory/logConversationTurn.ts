// lib/crussader-assistant/memory/logConversationTurn.ts
// lib/crussader-assistant/memory/logConversationTurn.ts

import { prisma } from "@/lib/prisma";

type Args = {
  conversationId: string;
  role: "user" | "assistant";
  rawText: string;
  rewrittenText?: string | null;
  interactionMode?: string | null;
  detectedCapability?: string | null;
};

export async function logConversationTurn(args: Args) {

  const {
    conversationId,
    role,
    rawText,
    rewrittenText = null,
    interactionMode = null,
    detectedCapability = null
  } = args;

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO assistant_conversation_turn
    (
      conversation_id,
      role,
      raw_text,
      rewritten_text,
      interaction_mode,
      detected_capability
    )
    VALUES ($1::uuid,$2,$3,$4,$5,$6)
    `,
    conversationId,
    role,
    rawText,
    rewrittenText,
    interactionMode,
    detectedCapability
  );
}