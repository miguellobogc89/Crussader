// lib/slots/slot-recovery/actions/cancelAppointmentByWhatsapp.ts
import { prisma } from "@/lib/prisma";

type Params = {
  fromPhone: string;
};

export async function cancelAppointmentByWhatsapp(params: Params) {
  const appointment = await prisma.appointment.findFirst({
    where: {
      customerPhone: params.fromPhone,
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
      reason: "appointment_not_found",
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