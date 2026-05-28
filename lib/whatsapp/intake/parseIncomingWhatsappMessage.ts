// lib/whatsapp/intake/parseIncomingWhatsappMessage.ts

import { tsToDate } from "@/lib/whatsapp/webhooks/messageParsers";

export type ParsedWhatsappMessage = {
  messageId: string | null;
  fromPhone: string;
  type: "text" | "button" | "interactive" | "unknown";
  text: string;
  buttonId: string | null;
  buttonText: string | null;
  displayText: string;
  contextMessageId: string | null;
  receivedAt: Date;
  raw: unknown;
};

type WhatsappWebhookMessage = {
  id?: unknown;
  from?: unknown;
  timestamp?: unknown;
  type?: unknown;
  text?: {
    body?: unknown;
  };
  button?: {
    payload?: unknown;
    text?: unknown;
  };
  interactive?: {
    button_reply?: {
      id?: unknown;
      title?: unknown;
    };
    list_reply?: {
      id?: unknown;
      title?: unknown;
    };
  };
  context?: {
    id?: unknown;
  };
};

export function parseIncomingWhatsappMessage(
  message: WhatsappWebhookMessage,
): ParsedWhatsappMessage {
  let messageId: string | null = null;

  if (typeof message.id === "string" && message.id.trim() !== "") {
    messageId = message.id.trim();
  }

  let fromPhone = "";

  if (typeof message.from === "string") {
    fromPhone = message.from.trim();
  }

  let type: ParsedWhatsappMessage["type"] = "unknown";

  if (message.type === "text") {
    type = "text";
  }

  if (message.type === "button") {
    type = "button";
  }

  if (message.type === "interactive") {
    type = "interactive";
  }

  let text = "";

  if (typeof message.text?.body === "string") {
    text = message.text.body.trim();
  }

  let buttonId: string | null = null;
  let buttonText: string | null = null;

  if (typeof message.button?.payload === "string") {
    buttonId = message.button.payload.trim();
  }

  if (typeof message.button?.text === "string") {
    buttonText = message.button.text.trim();
  }

  if (typeof message.interactive?.button_reply?.id === "string") {
    buttonId = message.interactive.button_reply.id.trim();
  }

  if (typeof message.interactive?.button_reply?.title === "string") {
    buttonText = message.interactive.button_reply.title.trim();
  }

  if (typeof message.interactive?.list_reply?.id === "string") {
    buttonId = message.interactive.list_reply.id.trim();
  }

  if (typeof message.interactive?.list_reply?.title === "string") {
    buttonText = message.interactive.list_reply.title.trim();
  }

  let contextMessageId: string | null = null;

  if (typeof message.context?.id === "string") {
    contextMessageId = message.context.id.trim();
  }

let receivedAt = new Date();

if (typeof message.timestamp === "string") {
  receivedAt = tsToDate(message.timestamp) ?? new Date();
}

let displayText = text;

if (displayText === "" && buttonText) {
  displayText = buttonText;
}

if (displayText === "" && buttonId) {
  displayText = buttonId;
}

  return {
    messageId,
    fromPhone,
    type,
    text,
    buttonId,
    buttonText,
    displayText,
    contextMessageId,
    receivedAt,
    raw: message,
  };
}