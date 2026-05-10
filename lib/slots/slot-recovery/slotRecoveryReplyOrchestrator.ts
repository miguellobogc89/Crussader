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

    console.log("[WA][SLOT_RECOVERY][MATCHED_RECIPIENT]", {
      recipientId: matchedRecipient.id,
      slotId: matchedRecipient.slot_recovery_slot_id,
      customerId: matchedRecipient.customer_id,
      contextMessageId,
      fromPhone,
      replyType,
      replyPayload,
      repliedAt: safeRepliedAt,
    });

    if (replyType === "BOOK" || replyType === "RESERVAR") {
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

      const safeMeta: Record<string, unknown> = {};

      if (matchedRecipient.meta && typeof matchedRecipient.meta === "object") {
        Object.assign(safeMeta, matchedRecipient.meta as Record<string, unknown>);
      }

      const recipientUpdateData: {
        reply_source: string;
        reply_button_id: string;
        reply_button_text: string | null;
        reply_payload: {
          context_message_id: string;
          from_phone: string;
          selected_service_id: string;
        };
        replied_at: Date;
        status: string;
        booked_at?: Date;
        reply_message_id?: string;
        meta: Record<string, unknown>;
      } = {
        reply_source: "button",
        reply_button_id: replyType,
        reply_button_text: replyPayload,
        reply_payload: {
          context_message_id: contextMessageId,
          from_phone: fromPhone,
          selected_service_id: selectedServiceId,
        },
        replied_at: safeRepliedAt,
        status: "replied",
        meta: {
          ...safeMeta,
          reply_payload: replyPayload,
          context_message_id: contextMessageId,
          from_phone: fromPhone,
          selected_service_id: selectedServiceId,
        },
      };

      if (incomingMessageId) {
        recipientUpdateData.reply_message_id = incomingMessageId;
      }

      if (result.ok) {
        recipientUpdateData.status = "booked";
        recipientUpdateData.booked_at = safeRepliedAt;
      }

      await prisma.slot_recovery_recipient.update({
        where: {
          id: matchedRecipient.id,
        },
        data: recipientUpdateData,
      });

      await recomputeSlotCounters({
        slotId: matchedRecipient.slot_recovery_slot_id,
      });

if (result.ok) {
  console.log("[ACTIVITY][BOOKED_EVENT_CREATING]", {
    recipientId: matchedRecipient.id,
    slotId: matchedRecipient.slot_recovery_slot_id,
    serviceId: selectedServiceId,
  });

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
      company_id: true,
      location_id: true,
      starts_at: true,
      Location: {
        select: {
          title: true,
        },
      },
    },
  });

  const bookedCustomer = await prisma.customer.findUnique({
    where: {
      id: matchedRecipient.customer_id,
    },
    select: {
      firstName: true,
      preferred_name: true,
      whatsapp_name: true,
    },
  });

  if (slotData && slotService) {
    let bookedCustomerName = "Cliente";

    if (bookedCustomer?.preferred_name) {
      bookedCustomerName = bookedCustomer.preferred_name;
    } else if (bookedCustomer?.whatsapp_name) {
      bookedCustomerName = bookedCustomer.whatsapp_name;
    } else if (bookedCustomer?.firstName) {
      bookedCustomerName = bookedCustomer.firstName;
    }

await logSlotActivity({
  companyId: slotData.company_id,
  locationId: slotData.location_id,
  slotId: matchedRecipient.slot_recovery_slot_id,
  eventType: "slot_booked",
  title: `${bookedCustomerName} ha reservado el hueco para ${slotService.name}`,
  payload: {
    customer_id: matchedRecipient.customer_id,
    customer_name: bookedCustomerName,
    service_id: selectedServiceId,
    service_name: slotService.name,
  },
});
  }

  if (slotService && slotData) {
    let locationName = "";

    if (slotData.Location && slotData.Location.title) {
      locationName = slotData.Location.title;
    }

    await sendSlotRecoveryConfirmation({
      to: fromPhone,
      serviceName: slotService.name,
      startAt: slotData.starts_at,
      locationName,
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

        if (claimResult.ok) {
  const slotData = await prisma.slot_recovery_slot.findUnique({
    where: {
      id: matchedRecipient.slot_recovery_slot_id,
    },
    select: {
      company_id: true,
      location_id: true,
    },
  });

  const bookedCustomer = await prisma.customer.findUnique({
    where: {
      id: matchedRecipient.customer_id,
    },
    select: {
      firstName: true,
      preferred_name: true,
      whatsapp_name: true,
    },
  });

  if (slotData) {
    let bookedCustomerName = "Cliente";

    if (bookedCustomer?.preferred_name) {
      bookedCustomerName = bookedCustomer.preferred_name;
    } else if (bookedCustomer?.whatsapp_name) {
      bookedCustomerName = bookedCustomer.whatsapp_name;
    } else if (bookedCustomer?.firstName) {
      bookedCustomerName = bookedCustomer.firstName;
    }

    await prisma.slot_recovery_activity.create({
      data: {
        company_id: slotData.company_id,
        location_id: slotData.location_id,
        slot_recovery_slot_id: matchedRecipient.slot_recovery_slot_id,
        event_type: "slot_booked",
        title: `${bookedCustomerName} ha reservado el hueco`,
        payload: {
          customer_id: matchedRecipient.customer_id,
          customer_name: bookedCustomerName,
        },
      },
    });
  }
}
        console.log("[SLOT][ALREADY_TAKEN]", {
          slotId: matchedRecipient.slot_recovery_slot_id,
          winner: claimResult.slot?.recovered_customer_id,
          loser: matchedRecipient.customer_id,
        });

        const slotDataForMissedActivity = await prisma.slot_recovery_slot.findUnique({
  where: {
    id: matchedRecipient.slot_recovery_slot_id,
  },
  select: {
    company_id: true,
    location_id: true,
  },
});

if (slotDataForMissedActivity) {
  const existingMissedActivity = await prisma.slot_recovery_activity.findFirst({
    where: {
      slot_recovery_slot_id: matchedRecipient.slot_recovery_slot_id,
      event_type: "booking_missed",
    },
    select: {
      id: true,
      payload: true,
    },
  });

  let missedCount = 1;

  if (
    existingMissedActivity &&
    existingMissedActivity.payload &&
    typeof existingMissedActivity.payload === "object" &&
    !Array.isArray(existingMissedActivity.payload)
  ) {
    const payloadObject = existingMissedActivity.payload as Record<string, unknown>;
    const currentCount = payloadObject.missed_count;

    if (typeof currentCount === "number") {
      missedCount = currentCount + 1;
    }
  }

  let missedTitle = "1 usuario intentó reservar pero ya estaba ocupado";

  if (missedCount > 1) {
    missedTitle = `${missedCount} usuarios intentaron reservar pero ya estaba ocupado`;
  }

  if (existingMissedActivity) {
    await prisma.slot_recovery_activity.update({
      where: {
        id: existingMissedActivity.id,
      },
      data: {
        title: missedTitle,
        payload: {
          missed_count: missedCount,
        },
      },
    });
  } else {
await logSlotActivity({
  companyId: slotDataForMissedActivity.company_id,
  locationId: slotDataForMissedActivity.location_id,
  slotId: matchedRecipient.slot_recovery_slot_id,
  eventType: "booking_missed",
  title: missedTitle,
  payload: {
    missed_count: missedCount,
  },
});
  }
}

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

      const slotServices = await prisma.slot_recovery_slot_service.findMany({
        where: {
          slot_recovery_slot_id: matchedRecipient.slot_recovery_slot_id,
        },
        select: {
          slot_recovery_service_id: true,
        },
      });

      if (slotServices.length <= 1) {
        const singleServiceId =
          slotServices[0]?.slot_recovery_service_id ?? null;

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
    }

    let nextStatus = "replied";

    if (replyType === "BOOK" || replyType === "RESERVAR") {
      nextStatus = "booked";
    }

    if (replyType === "REJECT") {
      nextStatus = "declined";
    }

    let replyMessageIdToPersist: string | null = null;

    if (replyType !== "BOOK" && replyType !== "RESERVAR") {
      if (typeof message.id === "string" && message.id.trim() !== "") {
        replyMessageIdToPersist = message.id;
      }
    }

    const safeMeta: Record<string, unknown> = {};

    if (matchedRecipient.meta && typeof matchedRecipient.meta === "object") {
      Object.assign(safeMeta, matchedRecipient.meta as Record<string, unknown>);
    }

    const recipientUpdateData: {
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

    if (replyMessageIdToPersist) {
      recipientUpdateData.reply_message_id = replyMessageIdToPersist;
    }

    await prisma.slot_recovery_recipient.update({
      where: {
        id: matchedRecipient.id,
      },
      data: recipientUpdateData,
    });

    await recomputeSlotCounters({
      slotId: matchedRecipient.slot_recovery_slot_id,
    });
  }
}