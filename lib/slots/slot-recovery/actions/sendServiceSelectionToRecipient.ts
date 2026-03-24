// lib/slots/slot-recovery/actions/sendServiceSelectionToRecipient.ts

import { prisma } from "@/lib/prisma";
import { sendServiceSelection } from "@/lib/whatsapp/sendServiceSelection";

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

  console.log("[WA][SERVICE_SELECTION][BUTTON_CANDIDATES]", {
    slotId: params.slotId,
    servicesCount: availableServices.length,
    services: availableServices.map((item) => {
      return {
        id: item.slot_recovery_service.id,
        name: item.slot_recovery_service.name,
      };
    }),
  });

  const selectionResult = await sendServiceSelection({
    to: params.toPhone,
    bodyText: "¡Genial! Has conseguido la reserva. ¿Qué servicio quieres reservar?",
    buttonText: "Elegir servicio",
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

console.log("[WA][SERVICE_SELECTION][DEBUG_SAVE]", {
  recipientId: params.recipientId,
  selectionMessageId,
});

await prisma.slot_recovery_recipient.update({
  where: {
    id: params.recipientId,
  },
  data: {
    reply_message_id: selectionMessageId,
  },
});

const check = await prisma.slot_recovery_recipient.findUnique({
  where: {
    id: params.recipientId,
  },
  select: {
    reply_message_id: true,
  },
});

console.log("[WA][SERVICE_SELECTION][CHECK_DB]", check);

console.log("[WA][SERVICE_SELECTION][SAVED_REPLY_MESSAGE_ID]", {
  recipientId: params.recipientId,
  selectionMessageId,
});

  return {
    ok: true,
    selectionMessageId,
    servicesCount: availableServices.length,
  };
}