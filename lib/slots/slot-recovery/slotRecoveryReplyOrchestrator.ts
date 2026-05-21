// lib/slots/slot-recovery/slotRecoveryReplyOrchestrator.ts

import { prisma } from "@/lib/prisma";
import {
  buildReplyPayload,
  getContextMessageId,
  getSelectedServiceId,
  normalizeReplyType,
  tsToDate,
} from "./messageParsers";
import type { WaValue } from "./types";
import { handleSelectedServiceReply } from "./actions/handleSelectedServiceReply";
import { findMatchedRecipientFromIncomingMessage } from "./actions/findMatchedRecipientFromIncomingMessage";
import { claimSlotForRecipient } from "./actions/claimSlotForRecipient";
import { sendServiceSelectionToRecipient } from "./actions/sendServiceSelectionToRecipient";
import { recomputeSlotCounters } from "./actions/recomputeSlotCounters";
import { createAppointmentFromSlot } from "./actions/createAppointmentFromSlot";
import { sendSlotAlreadyTakenMessage } from "./messaging/sendSlotAlreadyTakenMessage";
import { sendSlotRecoveryConfirmation } from "./messaging/sendSlotRecoveryConfirmation";
import { logSlotActivity } from "@/lib/slots/slot-recovery/logSlotActivity";
import { cancelAppointmentByWhatsapp } from "@/lib/slots/slot-recovery/actions/cancelAppointmentByWhatsapp";
import { sendTextMessage } from "@/lib/whatsapp/sendTextMessage";

function isBookReply(replyType: string): boolean {
  return replyType === "BOOK" || replyType === "RESERVAR";
}

function isDeclineReply(replyType: string): boolean {
  const normalized = replyType.toLowerCase().trim();

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

function getIncomingText(message: {
  text?: {
    body?: unknown;
  };
}): string {
  if (typeof message.text?.body !== "string") {
    return "";
  }

  return message.text.body.trim();
}

function isCancelText(text: string): boolean {
  const normalized = text.toLowerCase().trim();

  return (
    normalized === "cancelar" ||
    normalized === "cancel" ||
    normalized === "anular" ||
    normalized === "cancelar cita" ||
    normalized === "anular cita"
  );
}

export async function handleSlotRecoveryReplies(value: WaValue) {
  if (!Array.isArray(value.messages) || value.messages.length === 0) {
    return;
  }

for (const message of value.messages) {
  let incomingMessageId: string | null = null;

  if (typeof message.id === "string" && message.id.trim() !== "") {
    incomingMessageId = message.id.trim();
  }

  if (incomingMessageId) {
    const alreadyProcessed = await prisma.slot_recovery_recipient.findFirst({
      where: {
        reply_message_id: incomingMessageId,
      },
      select: {
        id: true,
      },
    });

    if (alreadyProcessed) {
      console.log("[WA][SLOT_RECOVERY][DUPLICATED_MESSAGE_IGNORED]", {
        messageId: incomingMessageId,
      });

      continue;
    }
  }

  let fromPhone = "";

  if (typeof message.from === "string") {
    fromPhone = message.from.trim();
  }

  if (fromPhone === "") {
    continue;
  }

  const incomingText = getIncomingText(message);

  if (isCancelText(incomingText)) {
    const result = await cancelAppointmentByWhatsapp({
      fromPhone,
    });

    if (result.ok) {
      await sendTextMessage({
        to: fromPhone,
        text: "✅ Tu cita ha sido cancelada correctamente.",
      });
    } else {
      await sendTextMessage({
        to: fromPhone,
        text: "No hemos encontrado ninguna cita futura activa asociada a este número.",
      });
    }

    console.log("[WA][SLOT_RECOVERY][CANCEL_TEXT_DETECTED]", {
      fromPhone,
      messageId: incomingMessageId,
      text: incomingText,
      result,
    });

    continue;
  }

  const replyType = normalizeReplyType(message);
  const selectedServiceId = getSelectedServiceId(replyType);

  if (!replyType) {
    continue;
  }

    const repliedAt = tsToDate(message.timestamp);
    let safeRepliedAt = repliedAt;

    if (!safeRepliedAt) {
      safeRepliedAt = new Date();
    }

    const replyPayload = buildReplyPayload(message);
    const contextMessageId = getContextMessageId(message);

    if (!contextMessageId) {
      console.log("[WA][SLOT_RECOVERY][REPLY_WITHOUT_CONTEXT]", {
        fromPhone,
        replyType,
        replyPayload,
      });
      continue;
    }

    const { matchedRecipient, matchedSend } =
      await findMatchedRecipientFromIncomingMessage({
        contextMessageId,
      });

    if (!matchedRecipient) {
      if (!matchedSend) {
        console.log("[WA][SLOT_RECOVERY][REPLY_WITHOUT_MATCH]", {
          fromPhone,
          contextMessageId,
          replyType,
          replyPayload,
        });
      } else {
        console.log("[WA][SLOT_RECOVERY][RECIPIENT_WITHOUT_MATCH]", {
          fromPhone,
          contextMessageId,
          slotId: matchedSend.slotId,
          customerId: matchedSend.customerId,
          replyType,
          replyPayload,
        });
      }

      continue;
    }



    if (!isBookReply(replyType) && !selectedServiceId) {
      let nextStatus = "replied";

      if (isDeclineReply(replyType)) {
        nextStatus = "declined";
      }

      const safeMeta: Record<string, unknown> = {};

      if (matchedRecipient.meta && typeof matchedRecipient.meta === "object") {
        Object.assign(safeMeta, matchedRecipient.meta as Record<string, unknown>);
      }

      const updateData: {
        reply_source: string;
        reply_button_id: string;
        reply_button_text: string | null;
        reply_payload: {
          context_message_id: string;
          from_phone: string;
        };
        replied_at: Date;
        status: string;
        meta: Record<string, unknown>;
        reply_message_id?: string;
      } = {
        reply_source: "button",
        reply_button_id: replyType,
        reply_button_text: replyPayload,
        reply_payload: {
          context_message_id: contextMessageId,
          from_phone: fromPhone,
        },
        replied_at: safeRepliedAt,
        status: nextStatus,
        meta: {
          ...safeMeta,
          reply_payload: replyPayload,
          context_message_id: contextMessageId,
          from_phone: fromPhone,
        },
      };

      if (typeof message.id === "string" && message.id.trim() !== "") {
        updateData.reply_message_id = message.id;
      }

      await prisma.slot_recovery_recipient.update({
        where: {
          id: matchedRecipient.id,
        },
        data: updateData,
      });



      await recomputeSlotCounters({
        slotId: matchedRecipient.slot_recovery_slot_id,
      });

      continue;
    }

    if (isBookReply(replyType)) {
      const slotServices = await prisma.slot_recovery_slot_service.findMany({
        where: {
          slot_recovery_slot_id: matchedRecipient.slot_recovery_slot_id,
        },
        select: {
          slot_recovery_service_id: true,
        },
      });

      const slotData = await prisma.slot_recovery_slot.findUnique({
        where: {
          id: matchedRecipient.slot_recovery_slot_id,
        },
        select: {
          location_id: true,
        },
      });

      if (slotData && slotServices.length > 0) {
        await prisma.customer_service_interest.createMany({
          data: slotServices.map((s) => ({
            company_id: matchedRecipient.company_id,
            customer_id: matchedRecipient.customer_id,
            location_id: slotData.location_id,
            slot_recovery_slot_id: matchedRecipient.slot_recovery_slot_id,
            slot_recovery_service_id: s.slot_recovery_service_id,
            interest_type: "offered_click",
            source: "slot_recovery",
          })),
          skipDuplicates: true,
        });
      }
    }

    if (selectedServiceId) {

      await handleSelectedServiceReply({
        recipientId: matchedRecipient.id,
        selectedServiceId,
        replyType,
        replyPayload,
        contextMessageId,
        fromPhone,
        repliedAt: safeRepliedAt,
        messageId: incomingMessageId,
        existingMeta: matchedRecipient.meta,
        replyEventId: null,
      });

      const result = await createAppointmentFromSlot({
        slotId: matchedRecipient.slot_recovery_slot_id,
        customerId: matchedRecipient.customer_id,
        serviceId: selectedServiceId,
      });

      await prisma.slot_recovery_recipient.update({
        where: {
          id: matchedRecipient.id,
        },
        data: {
          reply_source: "button",
          reply_button_id: replyType,
          reply_button_text: replyPayload,
          reply_payload: {
            context_message_id: contextMessageId,
            from_phone: fromPhone,
            selected_service_id: selectedServiceId,
          },
          replied_at: safeRepliedAt,
          status: result.ok ? "booked" : "replied",
          booked_at: result.ok ? safeRepliedAt : undefined,
          reply_message_id: incomingMessageId ?? undefined,
          meta: {
            reply_payload: replyPayload,
            context_message_id: contextMessageId,
            from_phone: fromPhone,
            selected_service_id: selectedServiceId,
          },
        },
      });

      if (result.ok) {
        const slotData = await prisma.slot_recovery_slot.findUnique({
          where: {
            id: matchedRecipient.slot_recovery_slot_id,
          },
          select: {
            starts_at: true,
            Location: {
              select: {
                title: true,
              },
            },
          },
        });

        await sendSlotRecoveryConfirmation({
          to: fromPhone,
          serviceName: replyPayload ?? "tu cita",
          startAt: slotData?.starts_at ?? new Date(),
          locationName: slotData?.Location?.title ?? "",
        });
      }

      await recomputeSlotCounters({
        slotId: matchedRecipient.slot_recovery_slot_id,
      });

      continue;
    }

    const claimResult = await claimSlotForRecipient({
      slotId: matchedRecipient.slot_recovery_slot_id,
      customerId: matchedRecipient.customer_id,
    });

    if (!claimResult.ok) {
      if (claimResult.reason === "SLOT_ALREADY_TAKEN") {
        await sendSlotAlreadyTakenMessage({
          to: fromPhone,
        });
      }

      continue;
    }

    const slotServices = await prisma.slot_recovery_slot_service.findMany({
      where: {
        slot_recovery_slot_id: matchedRecipient.slot_recovery_slot_id,
      },
      select: {
        slot_recovery_service_id: true,
      },
    });

    if (slotServices.length <= 1) {
      const singleServiceId = slotServices[0]?.slot_recovery_service_id ?? null;

      const result = await createAppointmentFromSlot({
        slotId: matchedRecipient.slot_recovery_slot_id,
        customerId: matchedRecipient.customer_id,
        serviceId: singleServiceId,
      });

      if (result.ok) {
        const slotData = await prisma.slot_recovery_slot.findUnique({
          where: {
            id: matchedRecipient.slot_recovery_slot_id,
          },
          select: {
            starts_at: true,
            Location: {
              select: {
                title: true,
              },
            },
          },
        });

        await sendSlotRecoveryConfirmation({
          to: fromPhone,
          serviceName: "tu cita",
          startAt: slotData?.starts_at ?? new Date(),
          locationName: slotData?.Location?.title ?? "",
        });
      }
    } else {
      await sendServiceSelectionToRecipient({
        recipientId: matchedRecipient.id,
        slotId: matchedRecipient.slot_recovery_slot_id,
        toPhone: fromPhone,
      });
    }

    await prisma.slot_recovery_recipient.update({
      where: {
        id: matchedRecipient.id,
      },
      data: {
        reply_source: "button",
        reply_button_id: replyType,
        reply_button_text: replyPayload,
        reply_payload: {
          context_message_id: contextMessageId,
          from_phone: fromPhone,
        },
        replied_at: safeRepliedAt,
        status: "booked",
        meta: {
          reply_payload: replyPayload,
          context_message_id: contextMessageId,
          from_phone: fromPhone,
        },
      },
    });

    await recomputeSlotCounters({
      slotId: matchedRecipient.slot_recovery_slot_id,
    });
  }
}