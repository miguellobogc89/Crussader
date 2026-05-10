// lib/slots/slot-recovery/actions/createAppointmentFromSlot.ts

import { prisma } from "@/lib/prisma";

type CreateAppointmentFromSlotParams = {
  slotId: string;
  customerId: string;
  serviceId?: string | null;
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
      employee_id: true,
      starts_at: true,
      ends_at: true,
      recovered_appointment_id: true,
    },
  });

  if (!slot) {
    console.log("[APPOINTMENT][ERROR][SLOT_NOT_FOUND]", params);
    return { ok: false };
  }

  if (slot.recovered_appointment_id) {
    const existingBookedInterest =
      await prisma.customer_service_interest.findFirst({
        where: {
          customer_id: params.customerId,
          slot_recovery_slot_id: params.slotId,
          slot_recovery_service_id: params.serviceId,
          appointment_id: slot.recovered_appointment_id,
          interest_type: "booked",
        },
        select: {
          id: true,
        },
      });

    if (!existingBookedInterest) {
      await prisma.customer_service_interest.createMany({
        data: [
          {
            company_id: slot.company_id,
            customer_id: params.customerId,
            location_id: slot.location_id,
            slot_recovery_slot_id: params.slotId,
            slot_recovery_service_id: params.serviceId,
            appointment_id: slot.recovered_appointment_id,
            interest_type: "booked",
            source: "slot_recovery",
          },
        ],
        skipDuplicates: true,
      });

      console.log("[INTEREST][BOOKED][CREATED_FROM_EXISTING_APPOINTMENT]", {
        slotId: params.slotId,
        customerId: params.customerId,
        serviceId: params.serviceId,
        appointmentId: slot.recovered_appointment_id,
      });
    }

    console.log("[APPOINTMENT][SKIP_ALREADY_CREATED]", {
      slotId: params.slotId,
      appointmentId: slot.recovered_appointment_id,
    });

    return {
      ok: true,
      appointmentId: slot.recovered_appointment_id,
    };
  }

let slotService: {
  id: string;
  name: string;
  price: any;
  duration_min: number;
} | null = null;

if (params.serviceId) {
  slotService = await prisma.slot_recovery_service.findUnique({
    where: {
      id: params.serviceId,
    },
    select: {
      id: true,
      name: true,
      price: true,
      duration_min: true,
    },
  });

  if (!slotService) {
    console.log("[APPOINTMENT][ERROR][SERVICE_NOT_FOUND]", params);
    return { ok: false };
  }
}


  const customer = await prisma.customer.findUnique({
  where: {
    id: params.customerId,
  },
  select: {
    firstName: true,
    lastName: true,
    preferred_name: true,
    whatsapp_name: true,
    phone: true,
    email: true,
  },
});

let customerName = "Cliente";

if (customer?.preferred_name) {
  customerName = customer.preferred_name;
} else if (customer?.whatsapp_name) {
  customerName = customer.whatsapp_name;
} else {
  const fullName = `${customer?.firstName ?? ""} ${customer?.lastName ?? ""}`.trim();

  if (fullName) {
    customerName = fullName;
  }
}

  const appointment = await prisma.appointment.create({
    data: {
      locationId: slot.location_id,
      serviceId: undefined,
      startAt: slot.starts_at,
      endAt: slot.ends_at,
      status: "BOOKED",
      customerId: params.customerId,
      customerName,
      customerPhone: customer?.phone ?? null,
      customerEmail: customer?.email ?? null,
      employeeId: slot.employee_id,
      resourceId: null,
      serviceName: slotService?.name ?? null,
      servicePrice: slotService ? Number(slotService.price) : null,
      serviceDurationMin: slotService?.duration_min ?? null,
      slotRecoveryServiceId: slotService?.id ?? null,
      notes: "Created from slot_recovery",
    },
  });

  await prisma.customer_service_interest.createMany({
    data: [
      {
        company_id: slot.company_id,
        customer_id: params.customerId,
        location_id: slot.location_id,
        slot_recovery_slot_id: params.slotId,
        slot_recovery_service_id: params.serviceId,
        appointment_id: appointment.id,
        interest_type: "booked",
        source: "slot_recovery",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.slot_recovery_slot.update({
    where: {
      id: params.slotId,
    },
    data: {
      status: "recovered",
      recovered_appointment_id: appointment.id,
    },
  });

  console.log("[APPOINTMENT][CREATED]", {
    appointmentId: appointment.id,
    slotId: params.slotId,
    slotServiceId: params.serviceId,
    customerId: params.customerId,
  });

  return {
    ok: true,
    appointmentId: appointment.id,
  };
}