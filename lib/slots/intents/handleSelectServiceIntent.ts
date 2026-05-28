// lib/slots/intents/handleSelectServiceIntent.ts

import { prisma } from "@/lib/prisma";

import { handleSelectedServiceReply } from "@/lib/slots/actions/handleSelectedServiceReply";
import { createAppointmentFromSlot } from "@/lib/slots/actions/createAppointmentFromSlot";
import { recomputeSlotCounters } from "@/lib/slots/actions/recomputeSlotCounters";
import { sendSlotRecoveryConfirmation } from "@/lib/slots/messaging/sendSlotRecoveryConfirmation";

type Params = {
  recipientId: string;
  slotId: string;
  customerId: string;
  fromPhone: string;
  selectedServiceId: string;
  replyType: string;
  replyPayload: string | null;
  contextMessageId: string;
  repliedAt: Date;
  messageId: string | null;
  existingMeta: unknown;
};

export async function handleSelectServiceIntent(params: Params) {
  await handleSelectedServiceReply({
    recipientId: params.recipientId,
    selectedServiceId: params.selectedServiceId,
    replyType: params.replyType,
    replyPayload: params.replyPayload,
    contextMessageId: params.contextMessageId,
    fromPhone: params.fromPhone,
    repliedAt: params.repliedAt,
    messageId: params.messageId,
    existingMeta: params.existingMeta,
    replyEventId: null,
  });

  const result = await createAppointmentFromSlot({
    slotId: params.slotId,
    customerId: params.customerId,
    serviceId: params.selectedServiceId,
  });

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
        selected_service_id: params.selectedServiceId,
      },
      replied_at: params.repliedAt,
      status: result.ok ? "booked" : "replied",
      booked_at: result.ok ? params.repliedAt : undefined,
      reply_message_id: params.messageId ?? undefined,
      meta: {
        reply_payload: params.replyPayload,
        context_message_id: params.contextMessageId,
        from_phone: params.fromPhone,
        selected_service_id: params.selectedServiceId,
      },
    },
  });

  if (result.ok) {
    const slotData = await prisma.slot_recovery_slot.findUnique({
      where: {
        id: params.slotId,
      },
      select: {
        starts_at: true,
        Location: {
          select: {
            title: true,
          },
        },
      },
    });

    await sendSlotRecoveryConfirmation({
      to: params.fromPhone,
      serviceName: params.replyPayload ?? "tu cita",
      startAt: slotData?.starts_at ?? new Date(),
      locationName: slotData?.Location?.title ?? "",
    });
  }

  await recomputeSlotCounters({
    slotId: params.slotId,
  });

  return {
    ok: result.ok,
  };
}