// lib/slots/slot-recovery/messageParsers.ts

import type { WaMessageItem, WaStatusItem } from "./types";

export function tsToDate(ts?: string): Date | null {
  if (!ts) {
    return null;
  }

  const n = Number(ts);

  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }

  return new Date(n * 1000);
}

export function buildErrorMessage(statusItem: WaStatusItem): string | null {
  if (!Array.isArray(statusItem.errors) || statusItem.errors.length === 0) {
    return null;
  }

  const firstError = statusItem.errors[0];

  if (!firstError) {
    return null;
  }

  if (
    typeof firstError.message === "string" &&
    firstError.message.trim() !== ""
  ) {
    return firstError.message.trim();
  }

  if (
    typeof firstError.title === "string" &&
    firstError.title.trim() !== ""
  ) {
    return firstError.title.trim();
  }

  return "whatsapp_delivery_failed";
}

export function normalizeReplyType(message: WaMessageItem): string | null {
  if (
    message.interactive &&
    message.interactive.list_reply &&
    typeof message.interactive.list_reply.id === "string"
  ) {
    return message.interactive.list_reply.id.trim();
  }

  if (
    message.interactive &&
    message.interactive.button_reply &&
    typeof message.interactive.button_reply.id === "string"
  ) {
    const replyId = message.interactive.button_reply.id.trim().toUpperCase();

  if (replyId === "BOOK" || replyId === "RESERVAR") {
    return "BOOK";
  }

  if (
    replyId === "REJECT" ||
    replyId === "NO ME INTERESA"
  ) {
    return "REJECT";
  }

    return replyId;
  }

  if (message.button && typeof message.button.payload === "string") {
    const payload = message.button.payload.trim().toUpperCase();

    if (payload === "BOOK") {
      return "BOOK";
    }

    if (payload === "REJECT") {
      return "REJECT";
    }

    return payload;
  }

  return null;
}

export function buildReplyPayload(message: WaMessageItem): string | null {
  if (
    message.interactive &&
    message.interactive.button_reply &&
    typeof message.interactive.button_reply.title === "string" &&
    message.interactive.button_reply.title.trim() !== ""
  ) {
    return message.interactive.button_reply.title.trim();
  }

  if (
    message.button &&
    typeof message.button.text === "string" &&
    message.button.text.trim() !== ""
  ) {
    return message.button.text.trim();
  }

  if (
    message.text &&
    typeof message.text.body === "string" &&
    message.text.body.trim() !== ""
  ) {
    return message.text.body.trim();
  }

  return null;
}

export function getContextMessageId(message: WaMessageItem): string | null {
  if (!message.context) {
    return null;
  }

  if (typeof message.context.id !== "string") {
    return null;
  }

  const value = message.context.id.trim();

  if (value === "") {
    return null;
  }

  return value;
}

export function getSelectedServiceId(replyType: string | null): string | null {
  if (!replyType) {
    return null;
  }

  if (!replyType.startsWith("SERVICE_")) {
    return null;
  }

  const serviceId = replyType.replace("SERVICE_", "").trim();

  if (serviceId === "") {
    return null;
  }

  return serviceId;
}