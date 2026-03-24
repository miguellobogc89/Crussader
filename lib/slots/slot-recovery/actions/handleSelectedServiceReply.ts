// lib/slots/slot-recovery/actions/handleSelectedServiceReply.ts

import { prisma } from "@/lib/prisma";

type HandleSelectedServiceReplyParams = {
  recipientId: string;
  selectedServiceId: string;
  replyType: string;
  replyPayload: string | null;
  contextMessageId: string;
  fromPhone: string;
  repliedAt: Date | null;
  messageId: string | null;
  existingMeta: unknown;
};

export async function handleSelectedServiceReply(
  params: HandleSelectedServiceReplyParams,
) {
  const safeMeta: Record<string, unknown> = {};

  if (params.existingMeta && typeof params.existingMeta === "object") {
    Object.assign(safeMeta, params.existingMeta as Record<string, unknown>);
  }

  await prisma.slot_recovery_recipient.update({
    where: {
      id: params.recipientId,
    },
    data: {
      reply_source: "interactive_list",
      reply_button_id: params.replyType,
      reply_button_text: params.replyPayload,
      reply_message_id: params.messageId,
      reply_payload: {
        context_message_id: params.contextMessageId,
        from_phone: params.fromPhone,
        selected_service_id: params.selectedServiceId,
      },
      replied_at: params.repliedAt,
      meta: {
        ...safeMeta,
        selected_service_id: params.selectedServiceId,
        service_selection_context_message_id: params.contextMessageId,
        service_selection_from_phone: params.fromPhone,
      },
    },
  });

  const updatedRecipient = await prisma.slot_recovery_recipient.findUnique({
    where: {
      id: params.recipientId,
    },
    select: {
      id: true,
      reply_source: true,
      reply_button_id: true,
      reply_button_text: true,
      reply_message_id: true,
      reply_payload: true,
      replied_at: true,
      meta: true,
    },
  });

  console.log(
    "[WA][SERVICE_SELECTION][RECIPIENT_UPDATED]",
    updatedRecipient,
  );

  return {
    ok: true,
    recipient: updatedRecipient,
  };
}