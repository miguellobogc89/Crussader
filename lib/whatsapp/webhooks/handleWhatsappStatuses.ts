// lib/whatsapp/webhooks/handleWhatsappStatuses.ts

import { prisma } from "@/lib/prisma";
import { buildErrorMessage, tsToDate } from "./messageParsers";
import type { WaValue } from "./types";

function normalizeStatus(status: unknown) {
  if (typeof status !== "string") return "";
  return status.trim().toLowerCase();
}

function canUpdateMessagingStatus(current: string | null, next: string) {
  const currentStatus = normalizeStatus(current);

  if (next === "sent") {
    return currentStatus === "" || currentStatus === "pending";
  }

  if (next === "delivered") {
    return (
      currentStatus === "" ||
      currentStatus === "pending" ||
      currentStatus === "sent"
    );
  }

  if (next === "read") {
    return (
      currentStatus === "" ||
      currentStatus === "pending" ||
      currentStatus === "sent" ||
      currentStatus === "delivered"
    );
  }

  if (next === "failed") {
    return (
      currentStatus === "" ||
      currentStatus === "pending" ||
      currentStatus === "sent"
    );
  }

  return false;
}

async function updateMessagingMessageStatus(args: {
  metaMessageId: string;
  statusValue: string;
}) {
  const current = await prisma.messaging_message.findFirst({
    where: {
      provider_message_id: args.metaMessageId,
      direction: "out",
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!current) return;

  if (!canUpdateMessagingStatus(current.status, args.statusValue)) {
    return;
  }

  await prisma.messaging_message.update({
    where: {
      id: current.id,
    },
    data: {
      status: args.statusValue,
    },
  });
}

export async function handleWhatsappStatuses(value: WaValue) {
  if (!Array.isArray(value.statuses) || value.statuses.length === 0) {
    return;
  }

  for (const statusItem of value.statuses) {
    if (!statusItem.id) continue;

    const metaMessageId = statusItem.id.trim();
    if (!metaMessageId) continue;

    const statusValue = normalizeStatus(statusItem.status);
    if (!statusValue) continue;

    const statusDate = tsToDate(statusItem.timestamp);
    const errorMessage = buildErrorMessage(statusItem);

    if (statusValue === "sent") {
      await prisma.slot_recovery_send.updateMany({
        where: {
          meta_message_id: metaMessageId,
          status: {
            notIn: ["DELIVERED", "READ", "FAILED"],
          },
        },
        data: {
          status: "SENT",
        },
      });

      await prisma.slot_recovery_recipient.updateMany({
        where: {
          provider_message_id: metaMessageId,
          status: {
            notIn: ["delivered", "read", "failed"],
          },
        },
        data: {
          status: "sent",
        },
      });

      await updateMessagingMessageStatus({
        metaMessageId,
        statusValue,
      });

      continue;
    }

    if (statusValue === "delivered") {
      await prisma.slot_recovery_send.updateMany({
        where: {
          meta_message_id: metaMessageId,
          status: {
            notIn: ["READ", "FAILED"],
          },
        },
        data: {
          status: "DELIVERED",
          delivered_at: statusDate,
        },
      });

      await prisma.slot_recovery_recipient.updateMany({
        where: {
          provider_message_id: metaMessageId,
          status: {
            notIn: ["read", "failed"],
          },
        },
        data: {
          status: "delivered",
          delivered_at: statusDate,
        },
      });

      await updateMessagingMessageStatus({
        metaMessageId,
        statusValue,
      });

      continue;
    }

    if (statusValue === "read") {
      await prisma.slot_recovery_send.updateMany({
        where: {
          meta_message_id: metaMessageId,
          status: {
            not: "FAILED",
          },
        },
        data: {
          status: "READ",
          read_at: statusDate,
        },
      });

      await prisma.slot_recovery_recipient.updateMany({
        where: {
          provider_message_id: metaMessageId,
          status: {
            not: "failed",
          },
        },
        data: {
          status: "read",
          read_at: statusDate,
        },
      });

      await updateMessagingMessageStatus({
        metaMessageId,
        statusValue,
      });

      continue;
    }

    if (statusValue === "failed") {
      await prisma.slot_recovery_send.updateMany({
        where: {
          meta_message_id: metaMessageId,
          status: {
            notIn: ["DELIVERED", "READ"],
          },
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
          status: {
            notIn: ["delivered", "read"],
          },
        },
        data: {
          status: "failed",
          failure_reason: errorMessage,
        },
      });

      await updateMessagingMessageStatus({
        metaMessageId,
        statusValue,
      });
    }
  }
}