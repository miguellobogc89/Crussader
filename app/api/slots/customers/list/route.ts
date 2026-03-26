// app/api/slots/customers/list/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeText(value: string): string {
  return value.trim();
}

function getDisplayName(customer: {
  firstName: string | null;
  lastName: string | null;
  preferred_name: string | null;
  whatsapp_name: string | null;
}): string {
  const preferredName = customer.preferred_name?.trim();
  if (preferredName) {
    return preferredName;
  }

  const whatsappName = customer.whatsapp_name?.trim();
  if (whatsappName) {
    return whatsappName;
  }

  const fullName = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
  if (fullName) {
    return fullName;
  }

  return "Sin nombre";
}

function getCluster(params: {
  hasAppointment: boolean;
  cooldownUntil: Date | null;
  manualBlocked: boolean;
}): "available" | "cooldown" | "has_appointment" | "do_not_notify" {
  if (params.manualBlocked) {
    return "do_not_notify";
  }

  if (params.hasAppointment) {
    return "has_appointment";
  }

  if (params.cooldownUntil && params.cooldownUntil > new Date()) {
    return "cooldown";
  }

  return "available";
}

function getClusterOrder(
  cluster: "available" | "cooldown" | "has_appointment" | "do_not_notify"
): number {
  if (cluster === "available") {
    return 0;
  }

  if (cluster === "cooldown") {
    return 1;
  }

  if (cluster === "has_appointment") {
    return 2;
  }

  return 3;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const companyId = normalizeText(searchParams.get("companyId") ?? "");
    const slotId = normalizeText(searchParams.get("slotId") ?? "");
    const query = normalizeText(searchParams.get("q") ?? "");
    const limitParam = Number(searchParams.get("limit") ?? "50");

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId is required" },
        { status: 400 }
      );
    }

    const hasValidLimit = Number.isNaN(limitParam) === false;
    let limit = 50;

    if (hasValidLimit) {
      limit = limitParam;
    }

    if (limit < 1) {
      limit = 1;
    }

    if (limit > 200) {
      limit = 200;
    }

    let slotLocationId = "";

    if (slotId) {
      const slot = await prisma.slot_recovery_slot.findUnique({
        where: {
          id: slotId,
        },
        select: {
          id: true,
          location_id: true,
          company_id: true,
        },
      });

      if (!slot) {
        return NextResponse.json(
          { ok: false, error: "Slot not found" },
          { status: 404 }
        );
      }

      if (slot.company_id !== companyId) {
        return NextResponse.json(
          { ok: false, error: "Slot does not belong to company" },
          { status: 400 }
        );
      }

      slotLocationId = slot.location_id;
    }

    const customers = await prisma.companyCustomer.findMany({
      where: {
        companyId,
        customer: query
          ? {
              OR: [
                {
                  firstName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  preferred_name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  whatsapp_name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  phone: {
                    contains: query,
                  },
                },
                {
                  secondary_phone: {
                    contains: query,
                  },
                },
                {
                  email: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : undefined,
      },
      select: {
        id: true,
        companyId: true,
        customerId: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            preferred_name: true,
            whatsapp_name: true,
            phone: true,
            secondary_phone: true,
            email: true,
            country_code: true,
            secondary_country_code: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      take: limit,
    });

    const customerIds = customers.map((row) => row.customerId);

    

const slotServices = await prisma.slot_recovery_slot_service.findMany({
  where: {
    slot_recovery_slot_id: slotId,
  },
  select: {
    slot_recovery_service_id: true,
  },
});

const serviceIds = slotServices.map((s) => s.slot_recovery_service_id);

const interests = await prisma.customer_service_interest.findMany({
  where: {
    company_id: companyId,
    customer_id: {
      in: customerIds,
    },
    slot_recovery_service_id: {
      in: serviceIds,
    },
  },
  select: {
    customer_id: true,
    interest_type: true,
  },
});

const scoreMap = new Map<string, number>();

for (const interest of interests) {
  let score = 0;

  if (interest.interest_type === "booked") {
    score = 5;
  }

  if (interest.interest_type === "explicit") {
    score = 3;
  }

  if (interest.interest_type === "offered_click") {
    score = 1;
  }

  const prev = scoreMap.get(interest.customer_id) ?? 0;
  scoreMap.set(interest.customer_id, prev + score);
}

    const contactProfiles = await prisma.customer_contact_profile.findMany({
      where: {
        company_id: companyId,
        customer_id: {
          in: customerIds,
        },
      },
      select: {
        customer_id: true,
        interaction_status: true,
        last_notified_at: true,
        last_response_at: true,
        cooldown_until: true,
        manual_blocked: true,
        manual_block_reason: true,
      },
    });

    const profileMap = new Map(
      contactProfiles.map((profile) => [profile.customer_id, profile])
    );

    let appointments: {
  customerId: string | null;
  startAt: Date;
  serviceName: string | null;
}[] = [];

    if (slotLocationId) {

      console.log("slotLocationId", slotLocationId);
      appointments = await prisma.appointment.findMany({
        where: {
          customerId: {
            in: customerIds,
          },
          locationId: slotLocationId,
          startAt: {
            lt: new Date(), // SOLO pasados
          },
          status: {
            in: ["COMPLETED", "BOOKED"], // ajusta si usas otros
          },
        },
        orderBy: {
          startAt: "desc",
        },
        select: {
          customerId: true,
          startAt: true,
          serviceName: true, // ajusta al campo real si es distinto
        },
      });


    }

const lastAppointmentByCustomerId = new Map<
  string,
  {
    startAt: Date;
    serviceName: string | null;
  }
>();

for (const row of appointments) {
  if (!row.customerId) {
    continue;
  }

  if (lastAppointmentByCustomerId.has(row.customerId)) {
    continue;
  }

  lastAppointmentByCustomerId.set(row.customerId, {
    startAt: row.startAt,
    serviceName: row.serviceName,
  });
}

    const items = customers.map((row) => {
      const customer = row.customer;
      const profile = profileMap.get(row.customerId);

      let cooldownUntil: Date | null = null;
      let interactionStatus = "active";
      let manualBlocked = false;
      let manualBlockReason: string | null = null;
      let lastNotifiedAt: Date | null = null;
      let lastResponseAt: Date | null = null;

      if (profile) {
        cooldownUntil = profile.cooldown_until;
        interactionStatus = profile.interaction_status;
        manualBlocked = profile.manual_blocked;
        manualBlockReason = profile.manual_block_reason;
        lastNotifiedAt = profile.last_notified_at;
        lastResponseAt = profile.last_response_at;
      }

const hasAppointment = false;
const lastAppointment = lastAppointmentByCustomerId.get(row.customerId) ?? null;

const cluster = getCluster({
  hasAppointment,
  cooldownUntil,
  manualBlocked,
});

      return {
        id: row.id,
        companyId: row.companyId,
        customerId: row.customerId,
        interestScore: scoreMap.get(row.customerId) ?? 0,
        linkedAt: row.createdAt,
        cluster,
        hasAppointment,
        interactionStatus,
        manualBlocked,
        manualBlockReason,
        lastNotifiedAt,
        lastResponseAt,
        cooldownUntil,
        lastAppointmentAt: lastAppointment?.startAt ?? null,
        lastAppointmentServiceName: lastAppointment?.serviceName ?? null,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          preferredName: customer.preferred_name,
          whatsappName: customer.whatsapp_name,
          displayName: getDisplayName(customer),
          phone: customer.phone,
          secondaryPhone: customer.secondary_phone,
          email: customer.email,
          countryCode: customer.country_code,
          secondaryCountryCode: customer.secondary_country_code,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        },
      };
    });

    items.sort((a, b) => {
      const scoreDiff = (b.interestScore ?? 0) - (a.interestScore ?? 0);
if (scoreDiff !== 0) {
  return scoreDiff;
}
      const clusterDiff = getClusterOrder(a.cluster) - getClusterOrder(b.cluster);
      if (clusterDiff !== 0) {
        return clusterDiff;
      }

      const aManualBlocked = a.manualBlocked ? 1 : 0;
      const bManualBlocked = b.manualBlocked ? 1 : 0;
      if (aManualBlocked !== bManualBlocked) {
        return aManualBlocked - bManualBlocked;
      }

      const aLastNotifiedAt = a.lastNotifiedAt ? new Date(a.lastNotifiedAt).getTime() : 0;
      const bLastNotifiedAt = b.lastNotifiedAt ? new Date(b.lastNotifiedAt).getTime() : 0;
      if (aLastNotifiedAt !== bLastNotifiedAt) {
        return aLastNotifiedAt - bLastNotifiedAt;
      }

      return a.customer.displayName.localeCompare(b.customer.displayName, "es", {
        sensitivity: "base",
      });
    });

    const counts = {
      available: 0,
      cooldown: 0,
      has_appointment: 0,
      do_not_notify: 0,
    };

for (const item of items) {
  if (item.cluster === "available") {
    counts.available += 1;
  }

  if (item.cluster === "cooldown") {
    counts.cooldown += 1;
  }

  if (item.cluster === "has_appointment") {
    counts.has_appointment += 1;
  }

  if (item.cluster === "do_not_notify") {
    counts.do_not_notify += 1;
  }
}

    return NextResponse.json({
      ok: true,
      items,
      counts,
      total: items.length,
    });
  } catch (error) {
    console.error("GET /api/slots/customers/list error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}