// lib/slots/slot-recovery/actions/createAppointmentFromSlot.ts

import { prisma } from "@/lib/prisma";

type CreateAppointmentFromSlotParams = {
  slotId: string;
  customerId: string;
  serviceId: string; // slot_recovery_service.id
};

export async function createAppointmentFromSlot(
  params: CreateAppointmentFromSlotParams,
) {
  const slot = await prisma.slot_recovery_slot.findUnique({
    where: {
      id: params.slotId,
    },
    select: {
      id: true,
      company_id: true,
      location_id: true,
      starts_at: true,
      ends_at: true,
      recovered_appointment_id: true, // 👈 añadimos aquí
    },
  });

  if (!slot) {
    console.log("[APPOINTMENT][ERROR][SLOT_NOT_FOUND]", params);
    return { ok: false };
  }

  // 👇 idempotencia
  if (slot.recovered_appointment_id) {
    console.log("[APPOINTMENT][SKIP_ALREADY_CREATED]", {
      slotId: params.slotId,
      appointmentId: slot.recovered_appointment_id,
    });

    return {
      ok: true,
      appointmentId: slot.recovered_appointment_id,
    };
  }

  const slotService = await prisma.slot_recovery_service.findUnique({
    where: {
      id: params.serviceId,
    },
    select: {
      id: true,
      name: true,
      price: true,
      service_id: true, // 👈 mapping al Service real
    },
  });

  if (!slotService) {
    console.log("[APPOINTMENT][ERROR][SERVICE_NOT_FOUND]", params);
    return { ok: false };
  }

  // 🔑 ESTE ES EL PUNTO CLAVE
  if (!slotService.service_id) {
    console.log("[APPOINTMENT][ERROR][MISSING_SERVICE_MAPPING]", {
      slotServiceId: slotService.id,
    });

    return { ok: false };
  }

  const appointment = await prisma.appointment.create({
    data: {
      locationId: slot.location_id,
      serviceId: slotService.service_id,

      startAt: slot.starts_at,
      endAt: slot.ends_at,

      status: "BOOKED",

      customerId: params.customerId,

      // opcionales (no usamos)
      employeeId: null,
      resourceId: null,

      notes: "Created from slot_recovery",
    },
  });

  await prisma.slot_recovery_slot.update({
  where: {
    id: params.slotId,
  },
  data: {
    status: "completed",
  },
});

  console.log("[APPOINTMENT][CREATED]", {
    appointmentId: appointment.id,
    slotId: params.slotId,
    slotServiceId: params.serviceId,
    mappedServiceId: slotService.service_id,
    customerId: params.customerId,
  });

  // 🔗 link con slot_recovery
  await prisma.slot_recovery_slot.update({
    where: {
      id: params.slotId,
    },
    data: {
      recovered_appointment_id: appointment.id,
    },
  });

  return {
    ok: true,
    appointmentId: appointment.id,
  };
}