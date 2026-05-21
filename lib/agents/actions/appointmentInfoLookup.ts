// lib/agents/actions/appointmentInfoLookup.ts
import { prisma } from "@/lib/prisma";
import { updateSessionMemory } from "@/lib/agents/memory/updateSessionMemory";

function clean(v: unknown): string {
  return String(v || "").trim();
}

function digitsOnly(v: unknown): string {
  return String(v || "").replace(/[^\d]/g, "");
}

type AppointmentInfoLookupResult =
  | {
      ok: true;
      status: "FOUND";
      appointment: {
        id: string;
        status: "PENDING" | "BOOKED";
        startAt: string;
        endAt: string;
        locationId: string;
        locationTitle: string;
        serviceId: string;
        serviceName: string;
        customerId: string | null;
      };
      message: string;
    }
  | {
      ok: true;
      status: "NOT_FOUND";
      message: string;
    };

export async function appointmentInfoLookup(args: {
  sessionId: string;
  companyId: string;
  phone: string;
}): Promise<AppointmentInfoLookupResult> {
  const sessionId = clean(args.sessionId);
  const companyId = clean(args.companyId);
  const phone = clean(args.phone);
  const phoneDigits = digitsOnly(phone);

  if (!sessionId) {
    throw new Error("Missing sessionId");
  }

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!phone) {
    throw new Error("Missing phone");
  }

  if (!phoneDigits) {
    throw new Error("Missing normalized phone");
  }

  const companyCustomers = await prisma.companyCustomer.findMany({
    where: {
      companyId,
    },
    select: {
      customerId: true,
      customer: {
        select: {
          phone: true,
          secondary_phone: true,
        },
      },
    },
  });

  let customerId: string | null = null;

  for (const link of companyCustomers) {
    const primaryPhoneDigits = digitsOnly(link.customer.phone);
    const secondaryPhoneDigits = digitsOnly(link.customer.secondary_phone);

    if (primaryPhoneDigits === phoneDigits || secondaryPhoneDigits === phoneDigits) {
      customerId = link.customerId;
      break;
    }
    console.log("[APPT_INFO][INPUT]", {
  sessionId,
  companyId,
  phone,
  phoneDigits,
});
  }

  console.log("[APPT_INFO][CUSTOMER_MATCH]", {
  phoneDigits,
  customerId,
  companyCustomersCount: companyCustomers.length,
});

  if (!customerId) {
    await updateSessionMemory({
      sessionId,
      bucket: "state",
      patch: {
        appointmentInfoStatus: "NOT_FOUND",
        targetAppointmentId: null,
        targetAppointmentStatus: null,
        targetAppointmentStartAt: null,
        targetAppointmentEndAt: null,
        targetAppointmentServiceId: null,
        targetAppointmentServiceName: null,
        targetAppointmentLocationId: null,
        targetAppointmentLocationTitle: null,
      },
    });

    return {
      ok: true,
      status: "NOT_FOUND",
      message: "customer not found in company",
    };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      customerId,
      status: {
        in: ["PENDING", "BOOKED"],
      },
      location: {
        companyId,
      },
    },
    orderBy: [{ startAt: "asc" }],
    select: {
      id: true,
      status: true,
      startAt: true,
      endAt: true,
      customerId: true,
      serviceId: true,
      locationId: true,
      service: {
        select: {
          name: true,
        },
      },
      location: {
        select: {
          title: true,
        },
      },
    },
  });

  console.log("[APPT_INFO][APPOINTMENT_MATCH]", {
  customerId,
  appointmentId: appointment?.id ?? null,
  appointmentStatus: appointment?.status ?? null,
  appointmentStartAt: appointment?.startAt?.toISOString?.() ?? null,
});

  if (!appointment) {
    await updateSessionMemory({
      sessionId,
      bucket: "state",
      patch: {
        appointmentInfoStatus: "NOT_FOUND",
        targetAppointmentId: null,
        targetAppointmentStatus: null,
        targetAppointmentStartAt: null,
        targetAppointmentEndAt: null,
        targetAppointmentServiceId: null,
        targetAppointmentServiceName: null,
        targetAppointmentLocationId: null,
        targetAppointmentLocationTitle: null,
      },
    });

    return {
      ok: true,
      status: "NOT_FOUND",
      message: "active appointment not found",
    };
  }

  await updateSessionMemory({
    sessionId,
    bucket: "state",
    patch: {
      appointmentInfoStatus: "FOUND",
      targetAppointmentId: appointment.id,
      targetAppointmentStatus: appointment.status,
      targetAppointmentStartAt: appointment.startAt.toISOString(),
      targetAppointmentEndAt: appointment.endAt.toISOString(),
      targetAppointmentServiceId: appointment.serviceId,
      targetAppointmentServiceName: appointment.service?.name,
      targetAppointmentLocationId: appointment.locationId,
      targetAppointmentLocationTitle: appointment.location.title,
    },
  });

  return {
    ok: true,
    status: "FOUND",
    appointment: {
      id: appointment.id,
      status: appointment.status === "BOOKED" ? "BOOKED" : "PENDING",
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      locationId: appointment.locationId,
      locationTitle: appointment.location.title,
      serviceId: appointment.serviceId ?? "",
      serviceName: appointment.service?.name ?? "",
      customerId: appointment.customerId ?? null,
    },
    message: "active appointment found",
  };
}