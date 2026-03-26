// lib/slots/slot-recovery/actions/sendServiceSelectionToRecipient.ts

import { prisma } from "@/lib/prisma";
import { sendServiceSelection } from "@/lib/slots/slot-recovery/messaging/sendServiceSelection";

type SendServiceSelectionToRecipientParams = {
  recipientId: string;
  slotId: string;
  toPhone: string;
};

export async function sendServiceSelectionToRecipient(
  params: SendServiceSelectionToRecipientParams,
) {
  const slotWithServices = await prisma.slot_recovery_slot.findUnique({
    where: {
      id: params.slotId,
    },
    select: {
      slot_recovery_slot_service: {
        orderBy: {
          position: "asc",
        },
        select: {
          slot_recovery_service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  console.log("[WA][SERVICE_SELECTION][RAW_SLOT_SERVICES]", {
    slotId: params.slotId,
    slotWithServices,
  });

  const availableServices = slotWithServices?.slot_recovery_slot_service ?? [];

  if (availableServices.length <= 1) {
    return {
      ok: true,
      selectionMessageId: null,
      servicesCount: availableServices.length,
    };
  }


const selectionResult = await sendServiceSelection({
  to: params.toPhone,
  options: availableServices.map((item) => {
    return {
      id: `SERVICE_${item.slot_recovery_service.id}`,
      title: item.slot_recovery_service.name,
    };
  }),
});

  let selectionMessageId: string | null = null;

  if (
    selectionResult?.messages &&
    selectionResult.messages[0] &&
    selectionResult.messages[0].id
  ) {
    selectionMessageId = selectionResult.messages[0].id;
  }

  await prisma.slot_recovery_recipient.update({
    where: {
      id: params.recipientId,
    },
    data: {
      reply_message_id: selectionMessageId,
    },
  });

  return {
    ok: true,
    selectionMessageId,
    servicesCount: availableServices.length,
  };
}