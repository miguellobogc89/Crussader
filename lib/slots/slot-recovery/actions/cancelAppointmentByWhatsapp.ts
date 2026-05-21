// lib/slots/slot-recovery/actions/cancelAppointmentByWhatsapp.ts
import { prisma } from "@/lib/prisma";

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

  const recipient = await prisma.slot_recovery_recipient.findFirst({
    where: {
      customer_id: customer.id,
      status: "booked",
      slot_recovery_slot: {
        recovered_appointment_id: {
          not: null,
        },
      },
    },
    orderBy: {
      booked_at: "desc",
    },
    select: {
      id: true,
      slot_recovery_slot: {
        select: {
          recovered_appointment_id: true,
        },
      },
    },
  });

  const appointmentId =
    recipient?.slot_recovery_slot?.recovered_appointment_id ?? null;

  if (!appointmentId) {
    return {
      ok: false,
      reason: "appointment_not_found",
    };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      customerId: customer.id,
      status: {
        in: ["PENDING", "BOOKED"],
      },
      startAt: {
        gt: new Date(),
      },
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

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: "CANCELLED",
      cancellation_reason: "Cancelada por el cliente desde WhatsApp",
    },
  });

  return {
    ok: true,
    appointment,
  };
}