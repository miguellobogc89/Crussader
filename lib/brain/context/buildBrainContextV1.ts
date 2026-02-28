// lib/brain/context/buildBrainContextV1.ts
import { prisma } from "@/lib/prisma";
import type { BrainContextV1 } from "@/lib/brain/types";

function iso(d: Date): string {
  return d.toISOString();
}

function addDaysUTC(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function buildBrainContextV1(companyId: string): Promise<{
  ctx: BrainContextV1 | null;
  debug: Record<string, unknown>;
}> {
  const now = new Date();

  const apptPastDays = 7;
  const apptFutureDays = 30;
  const apptWindowStart = addDaysUTC(now, -apptPastDays);
  const apptWindowEnd = addDaysUTC(now, apptFutureDays);

  const reviewPastDays = 730;
  const reviewWindowStart = addDaysUTC(now, -reviewPastDays);
  const reviewWindowEnd = now;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      activity: true,
      phone: true,
      email: true,
      website: true,
      city: true,
      address: true,
      brandColor: true,
    },
  });

  if (!company) {
    return { ctx: null, debug: { companyId, error: "Company not found" } };
  }

  const locations = await prisma.location.findMany({
    where: { companyId },
    select: {
      id: true,
      title: true,
      timezone: true,
      phone: true,
      email: true,
      website: true,
      address: true,
      city: true,
      openingHours: true,
      exceptions: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const services = await prisma.service.findMany({
    where: { location: { companyId } },
    select: {
      id: true,
      locationId: true,
      name: true,
      active: true,
      durationMin: true,
      bufferBeforeMin: true,
      bufferAfterMin: true,
      priceCents: true,
      requiredRoleId: true,
      requiredResourceTagId: true,
    },
  });

  const rolesCatalog = await prisma.staffRole.findMany({
    select: { id: true, name: true, slug: true, active: true },
    orderBy: { name: "asc" },
  });

  const employees = await prisma.employee.findMany({
    where: { locations: { some: { location: { companyId } } } },
    select: {
      id: true,
      name: true,
      active: true,
      timezone: true,
      job_title: true,
      roles: {
        select: {
          roleId: true,
          isPrimary: true,
          role: { select: { name: true } },
        },
      },
      locations: {
        select: {
          locationId: true,
          isPrimary: true,
          visibleInLocation: true,
          allowCrossLocationBooking: true,
        },
      },
    },
  });

  const resourceTypes = await prisma.resourceType.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const resourceTags = await prisma.resourceTag.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const resources = await prisma.resource.findMany({
    where: { location: { companyId } },
    select: {
      id: true,
      locationId: true,
      name: true,
      active: true,
      capacity: true,
      typeId: true,
      tags: { select: { resourceTagId: true } },
    },
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      location: { companyId },
      startAt: { gte: apptWindowStart, lt: apptWindowEnd },
    },
    select: {
      id: true,
      locationId: true,
      serviceId: true,
      startAt: true,
      endAt: true,
      status: true,
      employeeId: true,
      resourceId: true,
      customerId: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
    },
    orderBy: { startAt: "asc" },
  });

  const reviews = await prisma.review.findMany({
    where: {
      Location: { companyId },
      createdAtG: { gte: reviewWindowStart, lt: reviewWindowEnd },
    },
    select: {
      id: true,
      locationId: true,
      provider: true,
      externalId: true,
      rating: true,
      comment: true,
      reviewerName: true,
      createdAtG: true,
      responded: true,
      respondedAt: true,
      replyComment: true,
      replyUpdatedAtG: true,
    },
    orderBy: { createdAtG: "desc" },
  });

  const isMultiLocation = locations.length > 1;

  const tzSet = new Set<string>();
  for (const l of locations) {
    if (l.timezone) tzSet.add(l.timezone);
  }
  if (tzSet.size === 0) tzSet.add("Europe/Madrid");
  const locationsByTz = Array.from(tzSet.values()).sort();
  const companyTimezone = locationsByTz[0] ?? "Europe/Madrid";

  let hasCrossLocationStaff = false;
  for (const e of employees) {
    if (e.locations.length > 1) {
      hasCrossLocationStaff = true;
      break;
    }
    if (e.locations.length === 1) {
      const only = e.locations[0];
      if (only && only.allowCrossLocationBooking) {
        hasCrossLocationStaff = true;
        break;
      }
    }
  }

  const ctx: BrainContextV1 = {
    contextVersion: "brain-context-v1",
    companyId: company.id,
    generatedAt: iso(now),
    timezone: companyTimezone,
    isMultiLocation,
    scope: {
      mode: isMultiLocation ? "multi_location" : "single_location",
      primaryLocationId: isMultiLocation ? null : (locations[0]?.id ?? null),
      primaryTimezone: companyTimezone,
    },
    windows: {
      appointments: {
        pastDays: apptPastDays,
        futureDays: apptFutureDays,
        apptWindowStart: iso(apptWindowStart),
        apptWindowEnd: iso(apptWindowEnd),
      },
      reviews: {
        pastDays: reviewPastDays,
        reviewWindowStart: iso(reviewWindowStart),
        reviewWindowEnd: iso(reviewWindowEnd),
      },
    },
    facts: {
      company: {
        name: company.name,
        activity: company.activity,
        phone: company.phone,
        email: company.email,
        website: company.website,
        city: company.city,
        address: company.address,
        brandColor: company.brandColor,
      },
      locations: locations.map((l) => ({
        id: l.id,
        title: l.title,
        timezone: l.timezone,
        phone: l.phone,
        email: l.email,
        website: l.website,
        address: l.address,
        city: l.city,
        openingHours: l.openingHours,
        exceptions: l.exceptions,
      })),
      services: services.map((s) => ({
        id: s.id,
        locationId: s.locationId,
        name: s.name,
        active: s.active,
        durationMin: s.durationMin,
        bufferBeforeMin: s.bufferBeforeMin,
        bufferAfterMin: s.bufferAfterMin,
        priceCents: s.priceCents,
        requiredRoleId: s.requiredRoleId,
        requiredResourceTagId: s.requiredResourceTagId,
      })),
      staff: {
        rolesCatalog,
        employees: employees.map((e) => ({
          id: e.id,
          name: e.name,
          active: e.active,
          timezone: e.timezone,
          jobTitle: e.job_title,
          roles: e.roles.map((r) => ({
            roleId: r.roleId,
            name: r.role.name,
            isPrimary: r.isPrimary,
          })),
          locations: e.locations.map((el) => ({
            locationId: el.locationId,
            isPrimary: el.isPrimary,
            visibleInLocation: el.visibleInLocation,
            allowCrossLocationBooking: el.allowCrossLocationBooking,
          })),
        })),
      },
      resources: {
        types: resourceTypes,
        tags: resourceTags,
        items: resources.map((r) => ({
          id: r.id,
          locationId: r.locationId,
          name: r.name,
          active: r.active,
          capacity: r.capacity,
          typeId: r.typeId,
          tagIds: r.tags.map((t) => t.resourceTagId),
        })),
      },
    },
    state: {
      now: iso(now),
      appointments: {
        apptWindowStart: iso(apptWindowStart),
        apptWindowEnd: iso(apptWindowEnd),
        items: appointments.map((a) => ({
          id: a.id,
          locationId: a.locationId,
          serviceId: a.serviceId,
          startAt: iso(a.startAt),
          endAt: iso(a.endAt),
          status: a.status,
          employeeId: a.employeeId,
          resourceId: a.resourceId,
          customerId: a.customerId,
          customerName: a.customerName,
          customerPhone: a.customerPhone,
          customerEmail: a.customerEmail,
        })),
      },
      reviews: {
        reviewWindowStart: iso(reviewWindowStart),
        reviewWindowEnd: iso(reviewWindowEnd),
        items: reviews.map((r) => ({
          id: r.id,
          locationId: r.locationId,
          provider: r.provider,
          externalId: r.externalId,
          rating: r.rating,
          comment: r.comment,
          reviewerName: r.reviewerName,
          createdAt: r.createdAtG ? iso(r.createdAtG) : null,
          responded: r.responded,
          respondedAt: r.respondedAt ? iso(r.respondedAt) : null,
          replyComment: r.replyComment,
          replyUpdatedAt: r.replyUpdatedAtG ? iso(r.replyUpdatedAtG) : null,
        })),
      },
    },
  };

  const debug = {
    companyId,
    isMultiLocation: ctx.isMultiLocation,
    scope: ctx.scope,
    locations: ctx.facts.locations.length,
    services: ctx.facts.services.length,
    employees: ctx.facts.staff.employees.length,
    resources: ctx.facts.resources.items.length,
    appointments: ctx.state.appointments.items.length,
    reviews: ctx.state.reviews.items.length,
    locationsByTz,
    hasCrossLocationStaff,
  };

  return { ctx, debug };
}