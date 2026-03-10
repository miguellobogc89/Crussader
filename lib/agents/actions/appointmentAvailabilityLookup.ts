// lib/agents/actions/appointmentAvailabilityLookup.ts
import { prisma } from "@/lib/prisma";
import { updateSessionMemory } from "@/lib/agents/memory/updateSessionMemory";

function clean(v: unknown): string {
  return String(v || "").trim();
}

export type AppointmentAvailabilityLookupResult =
  | {
      ok: true;
      status: "FOUND";
      serviceId: string;
      locationId: string;
      from: string;
      to: string;
      slots: Array<{
        startAt: string;
        endAt: string;
      }>;
      candidates: {
        employees: Array<{
          id: string;
          name: string;
        }>;
        resources: Array<{
          id: string;
          name: string;
        }>;
      };
      requirements: {
        durationMin: number;
        bufferBeforeMin: number;
        bufferAfterMin: number;
        requiredRoles: Array<{
          roleId: string;
          quantity: number;
        }>;
        requiredResourceTags: Array<{
          resourceTagId: string;
          quantity: number;
        }>;
      };
      message: string;
    }
  | {
      ok: true;
      status: "NOT_FOUND";
      serviceId: string;
      locationId: string;
      from: string;
      to: string;
      slots: [];
      candidates: {
        employees: Array<{
          id: string;
          name: string;
        }>;
        resources: Array<{
          id: string;
          name: string;
        }>;
      };
      requirements: {
        durationMin: number;
        bufferBeforeMin: number;
        bufferAfterMin: number;
        requiredRoles: Array<{
          roleId: string;
          quantity: number;
        }>;
        requiredResourceTags: Array<{
          resourceTagId: string;
          quantity: number;
        }>;
      };
      message: string;
    };

export async function appointmentAvailabilityLookup(args: {
  sessionId: string;
  companyId: string;
  serviceId: string;
  locationId: string;
  from: string;
  to: string;
}): Promise<AppointmentAvailabilityLookupResult> {
  const sessionId = clean(args.sessionId);
  const companyId = clean(args.companyId);
  const serviceId = clean(args.serviceId);
  const locationId = clean(args.locationId);
  const from = clean(args.from);
  const to = clean(args.to);

  if (!sessionId) {
    throw new Error("Missing sessionId");
  }

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!serviceId) {
    throw new Error("Missing serviceId");
  }

  if (!locationId) {
    throw new Error("Missing locationId");
  }

  if (!from) {
    throw new Error("Missing from");
  }

  if (!to) {
    throw new Error("Missing to");
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (Number.isNaN(fromDate.getTime())) {
    throw new Error("Invalid from");
  }

  if (Number.isNaN(toDate.getTime())) {
    throw new Error("Invalid to");
  }

  if (fromDate >= toDate) {
    throw new Error("Invalid range");
  }

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      locationId,
      location: {
        companyId,
      },
      active: true,
    },
    select: {
      id: true,
      locationId: true,
      durationMin: true,
      bufferBeforeMin: true,
      bufferAfterMin: true,
      location: {
        select: {
          timezone: true,
          openingHours: true,
          exceptions: true,
        },
      },
      ServiceRequiredRole: {
        select: {
          roleId: true,
          quantity: true,
        },
      },
      ServiceRequiredResourceTag: {
        select: {
          resourceTagId: true,
          quantity: true,
        },
      },
    },
  });

  if (!service) {
    await updateSessionMemory({
      sessionId,
      bucket: "state",
      patch: {
        availabilityLookupStatus: "NOT_FOUND",
        availabilityServiceId: serviceId,
        availabilityLocationId: locationId,
        availabilityFrom: from,
        availabilityTo: to,
        availabilitySlots: [],
      },
    });

    return {
      ok: true,
      status: "NOT_FOUND",
      serviceId,
      locationId,
      from,
      to,
      slots: [],
      candidates: {
        employees: [],
        resources: [],
      },
      requirements: {
        durationMin: 0,
        bufferBeforeMin: 0,
        bufferAfterMin: 0,
        requiredRoles: [],
        requiredResourceTags: [],
      },
      message: "service not found for location/company",
    };
  }

  const requiredRoles = service.ServiceRequiredRole.map((item) => {
    return {
      roleId: item.roleId,
      quantity: item.quantity,
    };
  });

  const requiredResourceTags = service.ServiceRequiredResourceTag.map((item) => {
    return {
      resourceTagId: item.resourceTagId,
      quantity: item.quantity,
    };
  });

  const roleIds = requiredRoles.map((item) => item.roleId);
  const resourceTagIds = requiredResourceTags.map((item) => item.resourceTagId);

  let employeeCandidates: Array<{ id: string; name: string }> = [];
  let resourceCandidates: Array<{ id: string; name: string }> = [];

  if (roleIds.length > 0) {
    const employees = await prisma.employee.findMany({
      where: {
        active: true,
        locations: {
          some: {
            locationId,
            visibleInLocation: true,
          },
        },
        roles: {
          some: {
            roleId: {
              in: roleIds,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    employeeCandidates = employees;
  }

  if (resourceTagIds.length > 0) {
    const resources = await prisma.resource.findMany({
      where: {
        locationId,
        active: true,
        tags: {
          some: {
            resourceTagId: {
              in: resourceTagIds,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    resourceCandidates = resources;
  }

  const missingEmployees =
    requiredRoles.length > 0 && employeeCandidates.length === 0;

  const missingResources =
    requiredResourceTags.length > 0 && resourceCandidates.length === 0;

  if (missingEmployees || missingResources) {
    await updateSessionMemory({
      sessionId,
      bucket: "state",
      patch: {
        availabilityLookupStatus: "NOT_FOUND",
        availabilityServiceId: serviceId,
        availabilityLocationId: locationId,
        availabilityFrom: from,
        availabilityTo: to,
        availabilitySlots: [],
      },
    });

    return {
      ok: true,
      status: "NOT_FOUND",
      serviceId,
      locationId,
      from,
      to,
      slots: [],
      candidates: {
        employees: employeeCandidates,
        resources: resourceCandidates,
      },
      requirements: {
        durationMin: service.durationMin,
        bufferBeforeMin: service.bufferBeforeMin,
        bufferAfterMin: service.bufferAfterMin,
        requiredRoles,
        requiredResourceTags,
      },
      message: "missing eligible employees or resources for service requirements",
    };
  }

  await updateSessionMemory({
    sessionId,
    bucket: "state",
    patch: {
      availabilityLookupStatus: "FOUND",
      availabilityServiceId: serviceId,
      availabilityLocationId: locationId,
      availabilityFrom: from,
      availabilityTo: to,
      availabilitySlots: [],
    },
  });

  return {
    ok: true,
    status: "FOUND",
    serviceId,
    locationId,
    from,
    to,
    slots: [],
    candidates: {
      employees: employeeCandidates,
      resources: resourceCandidates,
    },
    requirements: {
      durationMin: service.durationMin,
      bufferBeforeMin: service.bufferBeforeMin,
      bufferAfterMin: service.bufferAfterMin,
      requiredRoles,
      requiredResourceTags,
    },
    message: "availability candidates resolved",
  };
}