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

export async function handleSlotRecoveryReplies(value: WaValue) {
  if (!Array.isArray(value.messages) || value.messages.length === 0) {
    return;
  }

  for (const message of value.messages) {
    const replyType = normalizeReplyType(message);
    const selectedServiceId = getSelectedServiceId(replyType);

    if (!replyType) {
      continue;
    }

    let fromPhone = "";

    if (typeof message.from === "string") {
      fromPhone = message.from.trim();
    }

    if (fromPhone === "") {
      continue;
    }

    const repliedAt = tsToDate(message.timestamp);
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

    console.log("[WA][SLOT_RECOVERY][MATCHED_RECIPIENT]", {
      recipientId: matchedRecipient.id,
      slotId: matchedRecipient.slot_recovery_slot_id,
      customerId: matchedRecipient.customer_id,
      contextMessageId,
      fromPhone,
      replyType,
      replyPayload,
      repliedAt,
    });

if (selectedServiceId) {
  console.log("[WA][SERVICE_SELECTION][SERVICE_CHOSEN]", {
    recipientId: matchedRecipient.id,
    slotId: matchedRecipient.slot_recovery_slot_id,
    customerId: matchedRecipient.customer_id,
    selectedServiceId,
    replyType,
    replyPayload,
  });

  let incomingMessageId: string | null = null;

  if (typeof message.id === "string" && message.id.trim() !== "") {
    incomingMessageId = message.id;
  }

  await handleSelectedServiceReply({
    recipientId: matchedRecipient.id,
    selectedServiceId,
    replyType,
    replyPayload,
    contextMessageId,
    fromPhone,
    repliedAt,
    messageId: incomingMessageId,
    existingMeta: matchedRecipient.meta,
  });

  // 🔥 ESTA LÍNEA ES LA QUE TE FALTA O NO SE EJECUTA
const result = await createAppointmentFromSlot({
  slotId: matchedRecipient.slot_recovery_slot_id,
  customerId: matchedRecipient.customer_id,
  serviceId: selectedServiceId,
});

if (result.ok) {
  const slotService = await prisma.slot_recovery_service.findUnique({
    where: {
      id: selectedServiceId,
    },
    select: {
      name: true,
    },
  });

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

  if (slotService && slotData) {
    await sendSlotRecoveryConfirmation({
      to: fromPhone,
      serviceName: slotService.name,
      startAt: slotData.starts_at,
      locationName: slotData.Location?.title ?? "",
    });
  }
}

continue;
}

    const claimResult = await claimSlotForRecipient({
      slotId: matchedRecipient.slot_recovery_slot_id,
      customerId: matchedRecipient.customer_id,
    });

if (!claimResult.ok) {
  if (claimResult.reason === "SLOT_ALREADY_TAKEN") {
    console.log("[SLOT][ALREADY_TAKEN]", {
      slotId: matchedRecipient.slot_recovery_slot_id,
      winner: claimResult.slot?.recovered_customer_id,
      loser: matchedRecipient.customer_id,
    });

    await sendSlotAlreadyTakenMessage({
      to: fromPhone,
    });
  }

  continue;
}

    console.log("[WA][SERVICE_SELECTION][SLOT_STATE]", {
      slotId: matchedRecipient.slot_recovery_slot_id,
      recoveredCustomerId: claimResult.slot?.recovered_customer_id ?? null,
      currentCustomerId: matchedRecipient.customer_id,
      claimReason: claimResult.reason,
    });

    if (replyType === "BOOK" || replyType === "RESERVAR") {
      console.log("[WA][SERVICE_SELECTION][WINNER_BLOCK_ENTERED]", {
        slotId: matchedRecipient.slot_recovery_slot_id,
        customerId: matchedRecipient.customer_id,
        fromPhone,
      });

      await sendServiceSelectionToRecipient({
        recipientId: matchedRecipient.id,
        slotId: matchedRecipient.slot_recovery_slot_id,
        toPhone: fromPhone,
      });
    }

    let nextStatus = "replied";

    if (replyType === "BOOK" || replyType === "RESERVAR") {
      nextStatus = "booked";
    }

    if (replyType === "REJECT") {
      nextStatus = "declined";
    }

let replyMessageIdToPersist: string | null = null;

// SOLO guardar message.id si NO es BOOK/RESERVAR
if (replyType !== "BOOK" && replyType !== "RESERVAR") {
  if (typeof message.id === "string" && message.id.trim() !== "") {
    replyMessageIdToPersist = message.id;
  }
}

    const safeMeta: Record<string, unknown> = {};

    if (matchedRecipient.meta && typeof matchedRecipient.meta === "object") {
      Object.assign(safeMeta, matchedRecipient.meta as Record<string, unknown>);
    }

await prisma.slot_recovery_recipient.update({
  where: {
    id: matchedRecipient.id,
  },
  data: {
    reply_source: "button",
    reply_button_id: replyType,
    reply_button_text: replyPayload,

    // ❌ NO sobrescribir si ya existe uno (el de selección)
    ...(replyMessageIdToPersist
      ? { reply_message_id: replyMessageIdToPersist }
      : {}),

    reply_payload: {
      context_message_id: contextMessageId,
      from_phone: fromPhone,
    },
    replied_at: repliedAt,
    status: nextStatus,
    meta: {
      ...safeMeta,
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