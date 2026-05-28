// lib/slots/intents/handleBookSlotIntent.ts

import { prisma } from "@/lib/prisma";

import { claimSlotForRecipient } from "@/lib/slots/actions/claimSlotForRecipient";
import { createAppointmentFromSlot } from "@/lib/slots/actions/createAppointmentFromSlot";
import { recomputeSlotCounters } from "@/lib/slots/actions/recomputeSlotCounters";
import { sendServiceSelectionToRecipient } from "@/lib/slots/actions/sendServiceSelectionToRecipient";
import { sendSlotAlreadyTakenMessage } from "@/lib/slots/messaging/sendSlotAlreadyTakenMessage";
import { sendSlotRecoveryConfirmation } from "@/lib/slots/messaging/sendSlotRecoveryConfirmation";

type Params = {
  recipientId: string;
  companyId: string;
  customerId: string;
  slotId: string;
  fromPhone: string;
  replyType: string;
  replyPayload: string | null;
  contextMessageId: string;
  repliedAt: Date;
};

export async function handleBookSlotIntent(params: Params) {
  const claimResult = await claimSlotForRecipient({
    slotId: params.slotId,
    customerId: params.customerId,
  });

  if (!claimResult.ok) {
    if (claimResult.reason === "SLOT_ALREADY_TAKEN") {
      await sendSlotAlreadyTakenMessage({
        to: params.fromPhone,
      });
    }

    return {
      ok: false,
      reason: claimResult.reason,
    };
  }

  const slotServices = await prisma.slot_recovery_slot_service.findMany({
    where: {
      slot_recovery_slot_id: params.slotId,
    },
    select: {
      slot_recovery_service_id: true,
    },
  });

  const slotData = await prisma.slot_recovery_slot.findUnique({
    where: {
      id: params.slotId,
    },
    select: {
      location_id: true,
      starts_at: true,
      Location: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!slotData) {
    return {
      ok: false,
      reason: "slot_not_found",
    };
  }

  if (slotServices.length > 0) {
    await prisma.customer_service_interest.createMany({
      data: slotServices.map((service) => ({
        company_id: params.companyId,
        customer_id: params.customerId,
        location_id: slotData.location_id,
        slot_recovery_slot_id: params.slotId,
        slot_recovery_service_id: service.slot_recovery_service_id,
        interest_type: "offered_click",
        source: "slot_recovery",
      })),
      skipDuplicates: true,
    });
  }

  if (slotServices.length <= 1) {
    const singleServiceId = slotServices[0]?.slot_recovery_service_id ?? null;

    const result = await createAppointmentFromSlot({
      slotId: params.slotId,
      customerId: params.customerId,
      serviceId: singleServiceId,
    });

    if (result.ok) {
      await sendSlotRecoveryConfirmation({
        to: params.fromPhone,
        serviceName: null,
        startAt: slotData.starts_at,
        locationName: slotData.Location?.title ?? "",
      });
    }
  } else {
    await sendServiceSelectionToRecipient({
      recipientId: params.recipientId,
      slotId: params.slotId,
      toPhone: params.fromPhone,
    });
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
      status: "booked",
      meta: {
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