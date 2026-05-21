// lib/slots/slot-recovery/actions/cancelAppointmentByWhatsapp.ts
import { prisma } from "@/lib/prisma";
import { recomputeSlotCounters } from "./recomputeSlotCounters";

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

await prisma.slot_recovery_recipient.updateMany({
  where: {
    customer_id: customer.id,
    slot_recovery_slot: {
      recovered_appointment_id: appointment.id,
    },
  },
  data: {
    status: "cancelled",
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