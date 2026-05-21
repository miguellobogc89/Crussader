// lib/slots/slot-recovery/handleSlotRecoveryStatuses.ts
import { prisma } from "@/lib/prisma";
import { buildErrorMessage, tsToDate } from "./messageParsers";
import type { WaValue } from "./types";

export async function handleSlotRecoveryStatuses(value: WaValue) {
  if (!Array.isArray(value.statuses) || value.statuses.length === 0) {
    return;
  }

  for (const statusItem of value.statuses) {
    if (!statusItem.id) {
      continue;
    }

    const metaMessageId = statusItem.id.trim();

    if (metaMessageId === "") {
      continue;
    }

    let statusValue = "";

    if (typeof statusItem.status === "string") {
      statusValue = statusItem.status.trim().toLowerCase();
    }

    const statusDate = tsToDate(statusItem.timestamp);
    const errorMessage = buildErrorMessage(statusItem);

    if (statusValue === "sent") {
      await prisma.slot_recovery_send.updateMany({
        where: {
          meta_message_id: metaMessageId,
        },
        data: {
          status: "SENT",
        },
      });

      await prisma.slot_recovery_recipient.updateMany({
        where: {
          provider_message_id: metaMessageId,
        },
        data: {
          status: "sent",
        },
      });

      continue;
    }

    if (statusValue === "delivered") {
      await prisma.slot_recovery_send.updateMany({
        where: {
          meta_message_id: metaMessageId,
        },
        data: {
          status: "DELIVERED",
          delivered_at: statusDate,
        },
      });

      await prisma.slot_recovery_recipient.updateMany({
        where: {
          provider_message_id: metaMessageId,
        },
        data: {
          status: "delivered",
          delivered_at: statusDate,
        },
      });

      continue;
    }

    if (statusValue === "read") {
      await prisma.slot_recovery_send.updateMany({
        where: {
          meta_message_id: metaMessageId,
        },
        data: {
          status: "READ",
          read_at: statusDate,
        },
      });

      await prisma.slot_recovery_recipient.updateMany({
        where: {
          provider_message_id: metaMessageId,
        },
        data: {
          status: "read",
          read_at: statusDate,
        },
      });

      continue;
    }

    if (statusValue === "failed") {
      await prisma.slot_recovery_send.updateMany({
        where: {
          meta_message_id: metaMessageId,
        },
        data: {
          status: "FAILED",
          failed_at: statusDate,
          error_message: errorMessage,
        },
      });

      await prisma.slot_recovery_recipient.updateMany({
        where: {
          provider_message_id: metaMessageId,
        },
        data: {
          status: "failed",
          failure_reason: errorMessage,
        },
      });
    }
  }
}