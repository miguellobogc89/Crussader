// lib/slots/slot-recovery/logSlotActivity.ts
import { prisma } from "@/lib/prisma";

type LogSlotActivityParams = {
  companyId: string;
  locationId: string;
  slotId: string;
  eventType: string;
  title: string;
  payload?: Record<string, unknown>;
};

export async function logSlotActivity(params: LogSlotActivityParams) {
  const {
    companyId,
    locationId,
    slotId,
    eventType,
    title,
    payload = {},
  } = params;

  return prisma.slot_recovery_activity.create({
    data: {
      company_id: companyId,
      location_id: locationId,
      slot_recovery_slot_id: slotId,
      event_type: eventType,
      title,
      payload,
    },
  });
}