// lib/slots/slot-recovery/actions/recomputeSlotCounters.ts

import { prisma } from "@/lib/prisma";

type RecomputeSlotCountersParams = {
  slotId: string;
};

export async function recomputeSlotCounters(
  params: RecomputeSlotCountersParams,
) {
  const recipientStats = await prisma.slot_recovery_recipient.groupBy({
    by: ["slot_recovery_slot_id", "status"],
    where: {
      slot_recovery_slot_id: params.slotId,
    },
    _count: {
      _all: true,
    },
  });

  let repliedCount = 0;
  let bookedCount = 0;

  for (const row of recipientStats) {
    if (
      row.status === "replied" ||
      row.status === "booked" ||
      row.status === "declined"
    ) {
      repliedCount += row._count._all;
    }

    if (row.status === "booked") {
      bookedCount += row._count._all;
    }
  }

  await prisma.slot_recovery_slot.update({
    where: {
      id: params.slotId,
    },
    data: {
      replied_customer_count: repliedCount,
      booked_customer_count: bookedCount,
    },
  });

  return {
    ok: true,
    repliedCount,
    bookedCount,
  };
}