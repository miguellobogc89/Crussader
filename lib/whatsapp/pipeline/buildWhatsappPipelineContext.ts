// lib/whatsapp/pipeline/buildWhatsappPipelineContext.ts

import { prisma } from "@/lib/prisma";

import { parseIncomingWhatsappMessage } from "../intake/parseIncomingWhatsappMessage";
import { resolveWhatsappIntent } from "./resolveWhatsappIntent";
import type { WhatsappPipelineContext } from "./WhatsappPipelineContext";

import {
  buildReplyPayload,
  getContextMessageId,
  getSelectedServiceId,
  normalizeReplyType,
  tsToDate,
} from "@/lib/whatsapp/webhooks/messageParsers";

import { findMatchedRecipientFromIncomingMessage } from "@/lib/slots/actions/findMatchedRecipientFromIncomingMessage";

type Params = {
  message: any;
};

export async function buildWhatsappPipelineContext({
  message,
}: Params): Promise<WhatsappPipelineContext> {
  const parsedMessage = parseIncomingWhatsappMessage(message);
  const resolvedIntent = resolveWhatsappIntent(parsedMessage);

  const conversation = await prisma.messaging_conversation.findFirst({
    where: {
      contact_external_id: parsedMessage.fromPhone,
    },
    select: {
      id: true,
    },
  });

  const replyType = normalizeReplyType(message);
  const selectedServiceId = getSelectedServiceId(replyType);
  const replyPayload = buildReplyPayload(message);
  const contextMessageId =
    getContextMessageId(message) ?? parsedMessage.contextMessageId;

  const repliedAt = tsToDate(message.timestamp) ?? parsedMessage.receivedAt;

  let matchedRecipient = null;
  let matchedSend = null;

  if (contextMessageId) {
    const match = await findMatchedRecipientFromIncomingMessage({
      contextMessageId,
    });

    matchedRecipient = match.matchedRecipient;
    matchedSend = match.matchedSend;
  }

  return {
    parsedMessage,
    resolvedIntent,
    conversationId: conversation?.id ?? null,
    contextMessageId,
    replyPayload,
    replyType,
    selectedServiceId,
    repliedAt,
    matchedRecipient,
    matchedSend,
  };
}