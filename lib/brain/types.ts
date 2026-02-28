// lib/brain/types.ts
export type BrainInsight = {
  code: string;
  severity: "info" | "warn" | "error";
  text: string;
};

export type BrainContextV1 = {
  contextVersion: "brain-context-v1";
  companyId: string;
  generatedAt: string;
  timezone: string;
  isMultiLocation: boolean;
  scope: {
    mode: "single_location" | "multi_location";
    primaryLocationId: string | null;
    primaryTimezone: string;
  };
  windows: {
    appointments: {
      pastDays: number;
      futureDays: number;
      apptWindowStart: string;
      apptWindowEnd: string;
    };
    reviews: {
      pastDays: number;
      reviewWindowStart: string;
      reviewWindowEnd: string;
    };
  };
  facts: {
    company: {
      name: string;
      activity?: string | null;
      phone?: string | null;
      email?: string | null;
      website?: string | null;
      city?: string | null;
      address?: string | null;
      brandColor?: string | null;
    };
    locations: Array<{
      id: string;
      title: string;
      timezone?: string | null;
      phone?: string | null;
      email?: string | null;
      website?: string | null;
      address?: string | null;
      city?: string | null;
      openingHours?: unknown;
      exceptions?: unknown;
    }>;
    services: Array<{
      id: string;
      locationId: string;
      name: string;
      active: boolean;
      durationMin: number;
      bufferBeforeMin: number;
      bufferAfterMin: number;
      priceCents: number;
      requiredRoleId?: string | null;
      requiredResourceTagId?: string | null;
    }>;
    staff: {
      rolesCatalog: Array<{ id: string; name: string; slug: string; active: boolean }>;
      employees: Array<{
        id: string;
        name: string;
        active: boolean;
        timezone: string;
        jobTitle?: string | null;
        roles: Array<{ roleId: string; name: string; isPrimary: boolean }>;
        locations: Array<{
          locationId: string;
          isPrimary: boolean;
          visibleInLocation: boolean;
          allowCrossLocationBooking: boolean;
        }>;
      }>;
    };
    resources: {
      types: Array<{ id: string; name: string; slug: string }>;
      tags: Array<{ id: string; name: string; slug: string }>;
      items: Array<{
        id: string;
        locationId: string;
        name: string;
        active: boolean;
        capacity?: number | null;
        typeId?: string | null;
        tagIds: string[];
      }>;
    };
  };
  state: {
    now: string;
    appointments: {
      apptWindowStart: string;
      apptWindowEnd: string;
      items: Array<{
        id: string;
        locationId: string;
        serviceId: string;
        startAt: string;
        endAt: string;
        status: string;
        employeeId?: string | null;
        resourceId?: string | null;
        customerId?: string | null;
        customerName?: string | null;
        customerPhone?: string | null;
        customerEmail?: string | null;
      }>;
    };
    reviews: {
      reviewWindowStart: string;
      reviewWindowEnd: string;
      items: Array<{
        id: string;
        locationId: string;
        provider: string;
        externalId?: string | null;
        rating?: number | null;
        comment?: string | null;
        reviewerName?: string | null;
        createdAt: string | null;
        responded: boolean;
        respondedAt: string | null;
        replyComment?: string | null;
        replyUpdatedAt: string | null;
      }>;
    };
  };
};