// lib/whatsapp/outbound/sendAndLogWhatsappMessage.ts

import { prisma } from "@/lib/prisma";
import { sendTextMessage } from "@/lib/whatsapp/sendTextMessage";


type SendWhatsappMessageParams = {
  to: string;
  text: string;
  conversationId: string;
  payload?: unknown;
};

export async function sendAndLogWhatsappMessage({
  to,
  text,
  conversationId,
  payload,
}: SendWhatsappMessageParams) {
  if (!conversationId) {
    throw new Error("Missing conversationId");
  }

  const sendResult = await sendTextMessage({
    to,
    text,
  });

  const providerMessageId = sendResult?.messages?.[0]?.id;

  if (!providerMessageId) {
    throw new Error("Missing provider_message_id from Meta");
  }

  const now = new Date();

  const message = await prisma.messaging_message.create({
    data: {
      conversation_id: conversationId,
      provider_message_id: providerMessageId,
      direction: "out",
      kind: "text",
      text,
      status: "sent",
      provider_ts: now,
      payload: {
        kind: "text",
        displayText: text,
        meta: payload ?? null,
        whatsapp: sendResult,
      } as any,
    },
  });

  await prisma.messaging_conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      last_message_at: now,
    },
  });

  return {
    sendResult,
    message,
  };
}