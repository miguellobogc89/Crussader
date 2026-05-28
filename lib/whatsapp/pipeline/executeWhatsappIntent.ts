// lib/whatsapp/pipeline/executeWhatsappIntent.ts

import type { WhatsappPipelineContext } from "@/lib/whatsapp/pipeline/WhatsappPipelineContext";

import { handleCancelAppointmentIntent } from "@/lib/whatsapp/actions/handleCancelAppointmentIntent";
import { handleUnknownTextIntent } from "@/lib/whatsapp/actions/handleUnknownTextIntent";

import { handleDeclineSlotIntent } from "@/lib/slots/intents/handleDeclineSlotIntent";
import { handleBookSlotIntent } from "@/lib/slots/intents/handleBookSlotIntent";
import { handleSelectServiceIntent } from "@/lib/slots/intents/handleSelectServiceIntent";

export type ExecuteWhatsappIntentResult =
  | {
      type: "SEND_TEXT";
      text: string;
    }
  | {
      type: "FALLBACK_TO_LEGACY";
    }
  | {
      type: "HANDLED";
    };

export async function executeWhatsappIntent(
  ctx: WhatsappPipelineContext,
): Promise<ExecuteWhatsappIntentResult> {
  const { resolvedIntent, parsedMessage } = ctx;

  switch (resolvedIntent.intent) {
    case "CANCEL_APPOINTMENT": {
      const result = await handleCancelAppointmentIntent({
        fromPhone: parsedMessage.fromPhone,
      });

      return {
        type: "SEND_TEXT",
        text: result.replyText,
      };
    }

    case "UNKNOWN_TEXT": {
      const result = await handleUnknownTextIntent();

      return {
        type: "SEND_TEXT",
        text: result.replyText,
      };
    }

    case "DECLINE_SLOT": {
      if (!ctx.matchedRecipient) {
        return {
          type: "HANDLED",
        };
      }

      await handleDeclineSlotIntent({
        recipientId: ctx.matchedRecipient.id,
        slotId: ctx.matchedRecipient.slot_recovery_slot_id,
        replyType: ctx.replyType ?? "",
        replyPayload: ctx.replyPayload,
        contextMessageId: ctx.contextMessageId ?? "",
        fromPhone: parsedMessage.fromPhone,
        repliedAt: ctx.repliedAt,
        messageId: parsedMessage.messageId,
        existingMeta: ctx.matchedRecipient.meta,
      });

      return {
        type: "FALLBACK_TO_LEGACY",
      };
    }

    case "BOOK_SLOT": {
      if (!ctx.matchedRecipient) {
        return {
          type: "HANDLED",
        };
      }

await handleBookSlotIntent({
  recipientId: ctx.matchedRecipient.id,
  companyId: ctx.matchedRecipient.company_id,
  customerId: ctx.matchedRecipient.customer_id,
  slotId: ctx.matchedRecipient.slot_recovery_slot_id,
  fromPhone: parsedMessage.fromPhone,
  replyType: ctx.replyType ?? "",
  replyPayload: ctx.replyPayload,
  contextMessageId: ctx.contextMessageId ?? "",
  repliedAt: ctx.repliedAt,
});

      return {
        type: "HANDLED",
      };
    }

    case "SELECT_SERVICE": {
      if (!ctx.matchedRecipient || !ctx.selectedServiceId) {
        return {
          type: "HANDLED",
        };
      }

      await handleSelectServiceIntent({
        recipientId: ctx.matchedRecipient.id,
        slotId: ctx.matchedRecipient.slot_recovery_slot_id,
        customerId: ctx.matchedRecipient.customer_id,
        fromPhone: parsedMessage.fromPhone,
        selectedServiceId: ctx.selectedServiceId,
        replyType: ctx.replyType ?? "",
        replyPayload: ctx.replyPayload,
        contextMessageId: ctx.contextMessageId ?? "",
        repliedAt: ctx.repliedAt,
        messageId: parsedMessage.messageId,
        existingMeta: ctx.matchedRecipient.meta,
      });

      return {
        type: "HANDLED",
      };
    }

    default: {
      return {
        type: "HANDLED",
      };
    }
  }
}