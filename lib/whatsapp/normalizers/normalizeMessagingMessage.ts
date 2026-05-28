// lib/whatsapp/normalizers/normalizeMessagingMessage.ts

import type { NormalizedChatMessage } from "../types/NormalizedChatMessage";
import { renderWhatsappTemplateText } from "./renderWhatsappTemplateText";

type DbMessage = {
  direction: string | null;
  kind: string | null;
  provider_message_id: string | null;
  text: string | null;
  status: string | null;
  provider_ts: Date | null;
  payload: any;
};

type Params = {
  message: DbMessage;
  templateBodyPreview?: string | null;
};

function normalizeDirection(direction: string | null) {
  return direction === "out" ? "out" : "in";
}

function normalizeKind(kind: string | null): NormalizedChatMessage["kind"] {
  if (kind === "text") return "text";
  if (kind === "template") return "template";
  if (kind === "interactive") return "interactive";
  if (kind === "button") return "button";
  if (kind === "unknown") return "unknown";

  return "unknown";
}

export function normalizeMessagingMessage({
  message,
  templateBodyPreview,
}: Params): NormalizedChatMessage {
  const payload = message.payload ?? {};

  let displayText = "";

  if (typeof payload.displayText === "string") {
    displayText = payload.displayText.trim();
  }

  if (
    displayText === "" &&
    message.kind === "template" &&
    typeof templateBodyPreview === "string"
  ) {
    const params = Array.isArray(payload.templateParams)
      ? payload.templateParams
      : [];

    displayText = renderWhatsappTemplateText(templateBodyPreview, params).trim();
  }

  if (displayText === "" && typeof message.text === "string") {
    displayText = message.text.trim();
  }

  return {
    direction: normalizeDirection(message.direction),
    kind: normalizeKind(message.kind),
    providerMessageId: message.provider_message_id ?? null,
    displayText,
    providerTs: message.provider_ts ?? new Date(0),
    status: message.status ?? null,
    payload,
  };
}