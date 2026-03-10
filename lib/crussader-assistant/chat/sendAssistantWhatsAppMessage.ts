// lib/crussader-assistant/chat/sendAssistantWhatsAppMessage.ts
import { prisma } from "@/lib/prisma";

type SendAssistantWhatsAppMessageArgs = {
  conversationId: string;
  text: string;
};

function asText(value: unknown) {
  return String(value || "").trim();
}

export async function sendAssistantWhatsAppMessage(
  args: SendAssistantWhatsAppMessageArgs
) {
  const conversationId = asText(args.conversationId);
  const text = asText(args.text);

  if (!conversationId) {
    throw new Error("Missing conversationId");
  }

  if (!text) {
    throw new Error("Missing text");
  }

  const accessToken = asText(process.env.WHATSAPP_PERMANENT_TOKEN);

  if (!accessToken) {
    throw new Error("Missing WHATSAPP_PERMANENT_TOKEN");
  }

  const conversation = await prisma.messaging_conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      contact_phone_e164: true,
      contact_external_id: true,
      company_phone_number: {
        select: {
          phone_number_id: true,
        },
      },
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const to =
    asText(conversation.contact_phone_e164) ||
    asText(conversation.contact_external_id);

  if (!to) {
    throw new Error("Conversation without destination phone");
  }

  const phoneNumberId = asText(conversation.company_phone_number?.phone_number_id);

  if (!phoneNumberId) {
    throw new Error("Conversation without company phone number id");
  }

  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: text,
      },
    }),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      json && typeof json === "object"
        ? JSON.stringify(json)
        : "Meta send failed"
    );
  }

  const providerMessageId =
    json &&
    typeof json === "object" &&
    Array.isArray((json as { messages?: Array<{ id?: string }> }).messages) &&
    (json as { messages?: Array<{ id?: string }> }).messages &&
    (json as { messages?: Array<{ id?: string }> }).messages![0] &&
    typeof (json as { messages?: Array<{ id?: string }> }).messages![0].id === "string"
      ? (json as { messages?: Array<{ id?: string }> }).messages![0].id!
      : null;

  const now = new Date();

  await prisma.messaging_message.create({
    data: {
      conversation_id: conversationId,
      provider_message_id: providerMessageId,
      direction: "out",
      kind: "text",
      text,
      status: "sent",
      provider_ts: now,
      payload: json ?? {},
    },
  });

  await prisma.messaging_conversation.update({
    where: { id: conversationId },
    data: {
      last_message_at: now,
      updated_at: now,
    },
  });

  return {
    ok: true,
    providerMessageId,
    raw: json,
  };
}