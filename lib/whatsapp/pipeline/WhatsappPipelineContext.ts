// lib/whatsapp/pipeline/WhatsappPipelineContext.ts

import type { ParsedWhatsappMessage } from "../intake/parseIncomingWhatsappMessage";
import type { ResolvedWhatsappIntent } from "./resolveWhatsappIntent";

export type WhatsappPipelineContext = {
  parsedMessage: ParsedWhatsappMessage;
  resolvedIntent: ResolvedWhatsappIntent;

  conversationId: string | null;

  contextMessageId: string | null;
  replyPayload: string | null;
  replyType: string | null;
  selectedServiceId: string | null;

  repliedAt: Date;

  matchedRecipient: {
    id: string;
    company_id: string;
    customer_id: string;
    slot_recovery_slot_id: string;
    meta: unknown;
  } | null;

  matchedSend: {
  id: string;
  slotId: string;
  customerId: string;
} | null;
};