// lib/slots/intents/handleDeclineSlotIntent.ts

import { prisma } from "@/lib/prisma";
import { recomputeSlotCounters } from "@/lib/slots/actions/recomputeSlotCounters";

type Params = {
  recipientId: string;
  slotId: string;
  replyType: string;
  replyPayload: string | null;
  contextMessageId: string;
  fromPhone: string;
  repliedAt: Date;
  messageId: string | null;
  existingMeta: unknown;
};

export async function handleDeclineSlotIntent(params: Params) {
  const safeMeta: Record<string, unknown> = {};

  if (params.existingMeta && typeof params.existingMeta === "object") {
    Object.assign(safeMeta, params.existingMeta as Record<string, unknown>);
  }

  await prisma.slot_recovery_recipient.update({
    where: {
      id: params.recipientId,
    },
    data: {
      reply_source: "button",
      reply_button_id: params.replyType,
      reply_button_text: params.replyPayload,
      reply_payload: {
        context_message_id: params.contextMessageId,
        from_phone: params.fromPhone,
      },
      replied_at: params.repliedAt,
      status: "sent",
      reply_message_id: params.messageId ?? undefined,
      meta: {
        ...safeMeta,
        reply_payload: params.replyPayload,
        context_message_id: params.contextMessageId,
        from_phone: params.fromPhone,
      },
    },
  });

  await recomputeSlotCounters({
    slotId: params.slotId,
  });

  return {
    ok: true,
  };
}