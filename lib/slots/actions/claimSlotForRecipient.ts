// lib/slots/slot-recovery/actions/claimSlotForRecipient.ts

import { prisma } from "@/lib/prisma";

type ClaimSlotForRecipientParams = {
  slotId: string;
  customerId: string;
};

export async function claimSlotForRecipient(
  params: ClaimSlotForRecipientParams,
) {
  const slot = await prisma.slot_recovery_slot.findUnique({
    where: {
      id: params.slotId,
    },
    select: {
      id: true,
      status: true,
      recovered_customer_id: true,
    },
  });

  if (!slot) {
    return {
      ok: false,
      reason: "SLOT_NOT_FOUND",
      slot: null,
    };
  }

  if (
    slot.recovered_customer_id &&
    slot.recovered_customer_id !== params.customerId
  ) {
    return {
      ok: false,
      reason: "SLOT_ALREADY_TAKEN",
      slot,
    };
  }

  if (slot.recovered_customer_id === params.customerId) {
    return {
      ok: true,
      reason: "ALREADY_CLAIMED_BY_SAME_CUSTOMER",
      slot,
    };
  }

  const updatedSlot = await prisma.slot_recovery_slot.update({
    where: {
      id: params.slotId,
    },
    data: {
      recovered_customer_id: params.customerId,
      status: "recovered",
      recovered_at: new Date(),
    },
    select: {
      id: true,
      status: true,
      recovered_customer_id: true,
    },
  });

  return {
    ok: true,
    reason: "CLAIMED",
    slot: updatedSlot,
  };
}