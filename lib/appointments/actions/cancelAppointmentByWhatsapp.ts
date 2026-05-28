// lib/appointments/actions/cancelAppointmentByWhatsapp.ts

import { prisma } from "@/lib/prisma";
import { recomputeSlotCounters } from "@/lib/slots/actions/recomputeSlotCounters";

type Params = {
  fromPhone: string;
};

export async function cancelAppointmentByWhatsapp(params: Params) {
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { phone: params.fromPhone },
        { phone: `+${params.fromPhone}` },
        { secondary_phone: params.fromPhone },
        { secondary_phone: `+${params.fromPhone}` },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!customer) {
    return {
      ok: false,
      reason: "customer_not_found",
    };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      customerId: customer.id,
      status: {
        in: ["PENDING", "BOOKED"],
      },
      startAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      startAt: "asc",
    },
    select: {
      id: true,
      startAt: true,
      serviceName: true,
      customerPhone: true,
    },
  });

  if (!appointment) {
    return {
      ok: false,
      reason: "appointment_not_active_or_future",
    };
  }

  const slot = await prisma.slot_recovery_slot.findFirst({
    where: {
      recovered_appointment_id: appointment.id,
    },
    select: {
      id: true,
    },
  });

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: "CANCELLED",
      cancellation_reason: "Cancelada por el cliente desde WhatsApp",
    },
  });

  await prisma.slot_recovery_slot.updateMany({
    where: {
      recovered_appointment_id: appointment.id,
    },
    data: {
      status: "cancelled",
      cancelled_at: new Date(),
    },
  });

  if (slot) {
    await recomputeSlotCounters({
      slotId: slot.id,
    });
  }

  return {
    ok: true,
    appointment,
  };
}