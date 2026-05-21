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
  replyEventId: string | null;
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

  const recipientWithSlot = await prisma.slot_recovery_recipient.findUnique({
    where: {
      id: params.recipientId,
    },
    select: {
      id: true,
      company_id: true,
      customer_id: true,
      slot_recovery_slot_id: true,
      slot_recovery_slot: {
        select: {
          location_id: true,
        },
      },
      reply_source: true,
      reply_button_id: true,
      reply_button_text: true,
      reply_message_id: true,
      reply_payload: true,
      replied_at: true,
      meta: true,
    },
  });

  if (recipientWithSlot && recipientWithSlot.slot_recovery_slot) {
    await prisma.customer_service_interest.createMany({
      data: [
        {
          company_id: recipientWithSlot.company_id,
          customer_id: recipientWithSlot.customer_id,
          location_id: recipientWithSlot.slot_recovery_slot.location_id,
          slot_recovery_slot_id: recipientWithSlot.slot_recovery_slot_id,
          slot_recovery_service_id: params.selectedServiceId,
          interest_type: "explicit",
          source: "slot_recovery",
          source_event_id: params.replyEventId,
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log("[WA][SERVICE_SELECTION][RECIPIENT_UPDATED]", {
    recipientId: recipientWithSlot?.id ?? null,
    slotId: recipientWithSlot?.slot_recovery_slot_id ?? null,
    customerId: recipientWithSlot?.customer_id ?? null,
    selectedServiceId: params.selectedServiceId,
  });

  return {
    ok: true,
    recipient: recipientWithSlot,
  };
}