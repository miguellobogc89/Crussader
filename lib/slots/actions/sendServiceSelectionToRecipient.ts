// lib/slots/actions/sendServiceSelectionToRecipient.ts

import { prisma } from "@/lib/prisma";
import { sendServiceSelection } from "@/lib/slots/messaging/sendServiceSelection";

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
              price: true,
            },
          },
        },
      },
    },
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
      const service = item.slot_recovery_service;

      let description = "Precio a consultar";

      if (service.price !== null && service.price !== undefined) {
        description = `${service.price}€`;
      }

      return {
        id: `SERVICE_${service.id}`,
        title: service.name,
        description,
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