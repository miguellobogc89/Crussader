// lib/slots/whatsapp/inbound/logIncomingWhatsappMessage.ts

import { prisma } from "@/lib/prisma";

import type { ParsedWhatsappMessage } from "../intake/parseIncomingWhatsappMessage";

type Params = {
  conversationId: string | null;
  message: ParsedWhatsappMessage;
};

export async function logIncomingWhatsappMessage({
  conversationId,
  message,
}: Params) {
  if (!conversationId || !message.messageId) {
    return;
  }

  const existingMessage = await prisma.messaging_message.findFirst({
    where: {
      conversation_id: conversationId,
      direction: "in",
      provider_message_id: message.messageId,
    },
    select: {
      id: true,
    },
  });

  if (!existingMessage) {
    const textForPanel = message.displayText;

    await prisma.messaging_message.create({
      data: {
        conversation_id: conversationId,
        provider_message_id: message.messageId,
        direction: "in",
        kind: message.type,
        text: textForPanel,
        status: "received",
        provider_ts: message.receivedAt,
        payload: message.raw as any,
      },
    });
  }

  await prisma.messaging_conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      last_message_at: message.receivedAt,
      updated_at: new Date(),
    },
  });
}