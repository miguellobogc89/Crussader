// lib/crussader-assistant/chat/sendAssistantWhatsAppMessage.ts
import { prisma } from "@/lib/prisma";

type WhatsAppTemplateParameter = {
  type: "text";
  text: string;
};

type WhatsAppTemplateComponent = {
  type: "header" | "body" | "button";
  sub_type?: "quick_reply" | "url";
  index?: string;
  parameters: WhatsAppTemplateParameter[];
};

type SendAssistantWhatsAppMessageArgs = {
  conversationId: string;
  text?: string;
  template?: {
    name: string;
    language: string;
    components?: WhatsAppTemplateComponent[];
  };
};

function asText(value: unknown) {
  return String(value || "").trim();
}

export async function sendAssistantWhatsAppMessage(
  args: SendAssistantWhatsAppMessageArgs
) {
  const conversationId = asText(args.conversationId);
  const text = asText(args.text);

  const templateName = asText(args.template?.name);
  const templateLanguage = asText(args.template?.language);

  let templateComponents: WhatsAppTemplateComponent[] = [];

  if (Array.isArray(args.template?.components)) {
    templateComponents = args.template.components;
  }

  if (!conversationId) {
    throw new Error("Missing conversationId");
  }

  const hasText = text.length > 0;
  const hasTemplate = templateName.length > 0;

  if (!hasText && !hasTemplate) {
    throw new Error("Missing text or template");
  }

  if (hasText && hasTemplate) {
    throw new Error("Send either text or template, not both");
  }

  if (hasTemplate && !templateLanguage) {
    throw new Error("Missing template language");
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

  let to = asText(conversation.contact_phone_e164);

  if (!to) {
    to = asText(conversation.contact_external_id);
  }

  if (!to) {
    throw new Error("Conversation without destination phone");
  }

  const phoneNumberId = asText(conversation.company_phone_number?.phone_number_id);

  if (!phoneNumberId) {
    throw new Error("Conversation without company phone number id");
  }

  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  const requestBody: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to,
  };

  let messageKind = "text";
  let storedText = text;

  if (hasText) {
    requestBody.type = "text";
    requestBody.text = {
      body: text,
    };
  }

  if (hasTemplate) {
    requestBody.type = "template";
    requestBody.template = {
      name: templateName,
      language: {
        code: templateLanguage,
      },
    };

    if (templateComponents.length > 0) {
      (requestBody.template as Record<string, unknown>).components = templateComponents;
    }

    messageKind = "template";
    storedText = `[template] ${templateName} (${templateLanguage})`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    let message = "Meta send failed";

    if (json && typeof json === "object") {
      message = JSON.stringify(json);
    }

    throw new Error(message);
  }

  let providerMessageId: string | null = null;

  if (
    json &&
    typeof json === "object" &&
    Array.isArray((json as { messages?: Array<{ id?: string }> }).messages) &&
    (json as { messages?: Array<{ id?: string }> }).messages &&
    (json as { messages?: Array<{ id?: string }> }).messages![0] &&
    typeof (json as { messages?: Array<{ id?: string }> }).messages![0].id === "string"
  ) {
    providerMessageId = (json as { messages?: Array<{ id?: string }> }).messages![0].id || null;
  }

  const now = new Date();

  await prisma.messaging_message.create({
    data: {
      conversation_id: conversationId,
      provider_message_id: providerMessageId,
      direction: "out",
      kind: messageKind,
      text: storedText,
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