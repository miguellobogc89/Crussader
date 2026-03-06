// lib/agents/appointments/resolveAppointmentContext.ts
import { prisma } from "@/lib/prisma";

function clean(v: unknown): string {
  return String(v || "").trim();
}

export type CompanyLocationOption = {
  id: string;
  title: string;
  city: string | null;
  timezone: string | null;
};

export type ServiceOption = {
  id: string;
  locationId: string;
  name: string;
  durationMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  requiredRoleId: string | null;
  requiredResourceTagId: string | null;
  price: string;
};

export type ServicesByLocation = Record<string, ServiceOption[]>;

export type ResolveAppointmentContextResult = {
  locations: CompanyLocationOption[];
  hasMultipleLocations: boolean;
  defaultLocationId: string | null;
  services: ServiceOption[];
  servicesByLocation: ServicesByLocation;
};

export async function resolveAppointmentContext(args: {
  companyId: string;
  locationId?: string | null;
}): Promise<ResolveAppointmentContextResult> {
  const companyId = clean(args.companyId);
  const requestedLocationId = clean(args.locationId);

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  const locationsRaw = await prisma.location.findMany({
    where: {
      companyId,
      status: "ACTIVE",
    },
    orderBy: [{ isFeatured: "desc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      city: true,
      timezone: true,
    },
  });

  const locations: CompanyLocationOption[] = locationsRaw.map((loc) => {
    return {
      id: loc.id,
      title: loc.title,
      city: loc.city ?? null,
      timezone: loc.timezone ?? null,
    };
  });

  const hasMultipleLocations = locations.length > 1;

  let defaultLocationId: string | null = null;

  if (requestedLocationId.length > 0) {
    const exists = locations.find((loc) => loc.id === requestedLocationId);
    if (exists) {
      defaultLocationId = exists.id;
    }
  }

  if (!defaultLocationId) {
    if (locations.length === 1) {
      defaultLocationId = locations[0].id;
    }
  }

  const locationIds = locations.map((loc) => loc.id);

  let servicesRaw: Array<{
    id: string;
    locationId: string;
    name: string;
    durationMin: number;
    bufferBeforeMin: number;
    bufferAfterMin: number;
    requiredRoleId: string | null;
    requiredResourceTagId: string | null;
    price: any;
  }> = [];

  if (locationIds.length > 0) {
    servicesRaw = await prisma.service.findMany({
      where: {
        locationId: {
          in: locationIds,
        },
        active: true,
      },
      orderBy: [{ locationId: "asc" }, { name: "asc" }],
      select: {
        id: true,
        locationId: true,
        name: true,
        durationMin: true,
        bufferBeforeMin: true,
        bufferAfterMin: true,
        requiredRoleId: true,
        requiredResourceTagId: true,
        price: true,
      },
    });
  }

  const allServices: ServiceOption[] = servicesRaw.map((service) => {
    return {
      id: service.id,
      locationId: service.locationId,
      name: service.name,
      durationMin: service.durationMin,
      bufferBeforeMin: service.bufferBeforeMin,
      bufferAfterMin: service.bufferAfterMin,
      requiredRoleId: service.requiredRoleId ?? null,
      requiredResourceTagId: service.requiredResourceTagId ?? null,
      price: String(service.price),
    };
  });

  const servicesByLocation: ServicesByLocation = {};

  for (const location of locations) {
    servicesByLocation[location.id] = [];
  }

  for (const service of allServices) {
    if (!servicesByLocation[service.locationId]) {
      servicesByLocation[service.locationId] = [];
    }

    servicesByLocation[service.locationId].push(service);
  }

  let services: ServiceOption[] = [];

  if (defaultLocationId) {
    const selectedServices = servicesByLocation[defaultLocationId];
    if (selectedServices) {
      services = selectedServices;
    }
  }

  return {
    locations,
    hasMultipleLocations,
    defaultLocationId,
    services,
    servicesByLocation,
  };
}