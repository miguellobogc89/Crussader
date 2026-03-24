// lib/slots/slot-recovery/actions/findMatchedRecipientFromIncomingMessage.ts

import { prisma } from "@/lib/prisma";

type FindMatchedRecipientFromIncomingMessageParams = {
  contextMessageId: string;
};

export async function findMatchedRecipientFromIncomingMessage(
  params: FindMatchedRecipientFromIncomingMessageParams,
) {
  let matchedRecipient = await prisma.slot_recovery_recipient.findFirst({
    where: {
      OR: [
        { provider_message_id: params.contextMessageId },
        { reply_message_id: params.contextMessageId },
      ],
    },
    orderBy: {
      created_at: "desc",
    },
  });

  let matchedSend = null;

  if (!matchedRecipient) {
    matchedSend = await prisma.slot_recovery_send.findFirst({
      where: {
        meta_message_id: params.contextMessageId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (matchedSend) {
      matchedRecipient = await prisma.slot_recovery_recipient.findFirst({
        where: {
          slot_recovery_slot_id: matchedSend.slotId,
          customer_id: matchedSend.customerId,
        },
        orderBy: {
          created_at: "desc",
        },
      });
    }
  }

  return {
    matchedRecipient,
    matchedSend,
  };
}