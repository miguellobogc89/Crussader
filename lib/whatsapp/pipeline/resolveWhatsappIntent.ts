// lib/whatsapp/pipeline/resolveWhatsappIntent.ts

import type { ParsedWhatsappMessage } from "../intake/parseIncomingWhatsappMessage";

export type WhatsappIntent =
  | "CANCEL_APPOINTMENT"
  | "BOOK_SLOT"
  | "DECLINE_SLOT"
  | "SELECT_SERVICE"
  | "UNKNOWN_TEXT"
  | "IGNORED";

export type ResolvedWhatsappIntent = {
  intent: WhatsappIntent;
  replyType: string | null;
  selectedServiceId: string | null;
};

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function isCancelText(text: string): boolean {
  const normalized = normalizeText(text);

  return (
    normalized === "cancelar" ||
    normalized === "cancel" ||
    normalized === "anular" ||
    normalized === "cancelar cita" ||
    normalized === "anular cita"
  );
}

function isBookReply(value: string): boolean {
  const normalized = normalizeText(value);

  return normalized === "book" || normalized === "reservar";
}

function isDeclineReply(value: string): boolean {
  const normalized = normalizeText(value);

  return (
    normalized === "reject" ||
    normalized === "decline" ||
    normalized === "declined" ||
    normalized === "rechazar" ||
    normalized === "rechazado" ||
    normalized === "no_gracias" ||
    normalized === "not_interested" ||
    normalized === "no_interest" ||
    normalized === "no me interesa"
  );
}

function getSelectedServiceId(replyType: string | null): string | null {
  if (!replyType) {
    return null;
  }

  if (!replyType.startsWith("SERVICE_")) {
    return null;
  }

  return replyType.replace("SERVICE_", "").trim();
}

function resolveReplyType(message: ParsedWhatsappMessage): string | null {
  if (message.buttonId && message.buttonId.trim() !== "") {
    return message.buttonId.trim().toUpperCase();
  }

  if (message.buttonText && message.buttonText.trim() !== "") {
    return message.buttonText.trim().toUpperCase();
  }

  return null;
}

export function resolveWhatsappIntent(
  message: ParsedWhatsappMessage,
): ResolvedWhatsappIntent {
  if (message.type === "unknown") {
    return {
      intent: "IGNORED",
      replyType: null,
      selectedServiceId: null,
    };
  }

  if (message.type === "text") {
    if (isCancelText(message.text)) {
      return {
        intent: "CANCEL_APPOINTMENT",
        replyType: null,
        selectedServiceId: null,
      };
    }

    if (message.text.trim() !== "") {
      return {
        intent: "UNKNOWN_TEXT",
        replyType: null,
        selectedServiceId: null,
      };
    }

    return {
      intent: "IGNORED",
      replyType: null,
      selectedServiceId: null,
    };
  }

  const replyType = resolveReplyType(message);
  const selectedServiceId = getSelectedServiceId(replyType);

  if (selectedServiceId) {
    return {
      intent: "SELECT_SERVICE",
      replyType,
      selectedServiceId,
    };
  }

  if (replyType && isBookReply(replyType)) {
    return {
      intent: "BOOK_SLOT",
      replyType,
      selectedServiceId: null,
    };
  }

  if (replyType && isDeclineReply(replyType)) {
    return {
      intent: "DECLINE_SLOT",
      replyType,
      selectedServiceId: null,
    };
  }

  if (replyType) {
    return {
      intent: "UNKNOWN_TEXT",
      replyType,
      selectedServiceId: null,
    };
  }

  return {
    intent: "IGNORED",
    replyType: null,
    selectedServiceId: null,
  };
}