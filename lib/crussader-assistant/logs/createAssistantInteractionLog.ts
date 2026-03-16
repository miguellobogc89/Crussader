// lib/crussader-assistant/logs/createAssistantInteractionLog.ts

import { prisma } from "@/lib/prisma";

type CreateAssistantInteractionLogInput = {
  conversationId: string;

  installationId?: string | null;
  customerId?: string | null;

  requestedInstruction?: string | null;
  action?: string | null;
  product?: string | null;
  subtype?: string | null;

  status?: "COMPLETED" | "FAILED" | "ABANDONED" | "CANCELLED";

  title: string;
  description: string;

  collectedData?: Record<string, unknown> | null;
  resultPayload?: Record<string, unknown> | null;

  startedAt?: Date | null;
  finishedAt?: Date | null;
};

function asText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const v = value.trim();

  if (!v) {
    return null;
  }

  return v;
}

export async function createAssistantInteractionLog(
  input: CreateAssistantInteractionLogInput
) {
  const conversationId = asText(input.conversationId);

  if (!conversationId) {
    return;
  }

  const now = new Date();

  let startedAt = now;
  if (input.startedAt) {
    startedAt = input.startedAt;
  }

  let finishedAt = now;
  if (input.finishedAt) {
    finishedAt = input.finishedAt;
  }

  try {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO assistant_interaction_log (
        conversation_id,
        installation_id,
        customer_id,
        requested_instruction,
        action,
        product,
        subtype,
        status,
        started_at,
        finished_at,
        title,
        description,
        collected_data,
        result_payload
      )
      VALUES (
        CAST($1 AS uuid),
        CAST(NULLIF($2, '') AS uuid),
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        CAST($13 AS jsonb),
        CAST($14 AS jsonb)
      )
      `,
      conversationId,
      input.installationId || "",
      input.customerId || null,
      input.requestedInstruction || null,
      input.action || null,
      input.product || null,
      input.subtype || null,
      input.status || "COMPLETED",
      startedAt,
      finishedAt,
      input.title,
      input.description,
      JSON.stringify(input.collectedData || {}),
      JSON.stringify(input.resultPayload || {})
    );
  } catch (error) {
    console.error("[assistant-log] insert failed", error);
  }
}