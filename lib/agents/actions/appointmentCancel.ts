// lib/agents/actions/appointmentCancel.ts
import { prisma } from "@/lib/prisma";
import { updateSessionMemory } from "@/lib/agents/memory/updateSessionMemory";
import { appointmentInfoLookup } from "./appointmentInfoLookup";

function clean(v: unknown): string {
  return String(v || "").trim();
}

export type AppointmentCancelResult =
  | {
      ok: true;
      status: "CANCELLED";
      appointment: {
        id: string;
        previousStatus: "PENDING" | "BOOKED";
        newStatus: "CANCELLED";
        startAt: string;
        endAt: string;
        locationTitle: string;
        serviceName: string;
      };
      message: string;
    }
  | {
      ok: true;
      status: "NOT_FOUND";
      message: string;
    };

export async function appointmentCancel(args: {
  sessionId: string;
  companyId: string;
  phone: string;
}): Promise<AppointmentCancelResult> {
  const sessionId = clean(args.sessionId);
  const companyId = clean(args.companyId);
  const phone = clean(args.phone);

  if (!sessionId) {
    throw new Error("Missing sessionId");
  }

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!phone) {
    throw new Error("Missing phone");
  }

  const lookup = await appointmentInfoLookup({
    sessionId,
    companyId,
    phone,
  });

  if (lookup.status !== "FOUND") {
    await updateSessionMemory({
      sessionId,
      bucket: "state",
      patch: {
        appointmentCancelStatus: "NOT_FOUND",
      },
    });

    return {
      ok: true,
      status: "NOT_FOUND",
      message: "active appointment not found",
    };
  }

  const previousStatus = lookup.appointment.status;

  const updated = await prisma.appointment.update({
    where: {
      id: lookup.appointment.id,
    },
    data: {
      status: "CANCELLED",
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
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

  await updateSessionMemory({
    sessionId,
    bucket: "state",
    patch: {
      appointmentCancelStatus: "CANCELLED",
      targetAppointmentId: updated.id,
      targetAppointmentStatus: "CANCELLED",
      targetAppointmentStartAt: updated.startAt.toISOString(),
      targetAppointmentEndAt: updated.endAt.toISOString(),
      targetAppointmentServiceName: updated.service.name,
      targetAppointmentLocationTitle: updated.location.title,
      flow: "appointment_management",
      subReason: "cancel",
      step: "awaiting_cancellation_reason",
    },
  });

  return {
    ok: true,
    status: "CANCELLED",
    appointment: {
      id: updated.id,
      previousStatus,
      newStatus: "CANCELLED",
      startAt: updated.startAt.toISOString(),
      endAt: updated.endAt.toISOString(),
      locationTitle: updated.location.title,
      serviceName: updated.service.name,
    },
    message: "appointment cancelled",
  };
}