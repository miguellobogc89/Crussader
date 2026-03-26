// app/components/slots/helpers/slotsCustomersPickerHelpers.ts
export type CustomerCluster =
  | "available"
  | "cooldown"
  | "has_appointment"
  | "do_not_notify";

export type CustomerListItem = {
  id: string;
  companyId: string;
  customerId: string;
  linkedAt: string;
  cluster: CustomerCluster;
  hasAppointment: boolean;
  interactionStatus: string;
  manualBlocked: boolean;
  manualBlockReason: string | null;
  lastNotifiedAt: string | null;
  lastResponseAt: string | null;
  cooldownUntil: string | null;
  lastAppointmentAt: string | null;
  lastAppointmentServiceName: string | null;
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    preferredName: string | null;
    whatsappName: string | null;
    displayName: string;
    phone: string | null;
    secondaryPhone: string | null;
    email: string | null;
    countryCode: string | null;
    secondaryCountryCode: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type CreateCustomerResponseItem = {
  customerId: string;
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    preferredName: string | null;
    whatsappName: string | null;
    displayName: string;
    phone: string | null;
    secondaryPhone: string | null;
    email: string | null;
    countryCode: string | null;
    secondaryCountryCode: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export const MAX_SELECTED_CONTACTS = 10;

export const STATUS_CONFIG: Record<
  CustomerCluster,
  {
    label: string;
    badgeClassName: string;
    dotClassName: string;
  }
> = {
  available: {
    label: "Disponible",
    badgeClassName:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
    dotClassName: "bg-emerald-500",
  },
  cooldown: {
    label: "Cooldown",
    badgeClassName: "border-amber-500/20 bg-amber-500/10 text-amber-600",
    dotClassName: "bg-amber-500",
  },
  has_appointment: {
    label: "Con cita",
    badgeClassName: "border-crussader/20 bg-crussader/10 text-crussader",
    dotClassName: "bg-crussader",
  },
  do_not_notify: {
    label: "No avisar",
    badgeClassName: "border-red-500/20 bg-red-500/10 text-red-600",
    dotClassName: "bg-red-500",
  },
};

export function getInitials(item: CustomerListItem): string {
  const first =
    item.customer.firstName?.trim().charAt(0) ||
    item.customer.displayName?.trim().charAt(0) ||
    "C";

  const last = item.customer.lastName?.trim().charAt(0) || "";

  return `${first}${last}`.toUpperCase();
}

export function getFullPhone(item: CustomerListItem): string {
  const phone = item.customer.phone?.trim() || "";
  const countryCode = item.customer.countryCode?.trim() || "";

  if (!phone) {
    return "";
  }

  if (!countryCode) {
    return phone;
  }

  return `${countryCode} ${phone}`.trim();
}

export function buildInlineCreatedRow(
  companyId: string,
  created: CreateCustomerResponseItem
): CustomerListItem {
  return {
    id: `inline-${created.customerId}`,
    companyId,
    customerId: created.customerId,
    linkedAt: new Date().toISOString(),
    cluster: "available",
    hasAppointment: false,
    interactionStatus: "active",
    manualBlocked: false,
    manualBlockReason: null,
    lastNotifiedAt: null,
    lastResponseAt: null,
    cooldownUntil: null,
    lastAppointmentAt: null,
    lastAppointmentServiceName: null,
    customer: {
      id: created.customer.id,
      firstName: created.customer.firstName,
      lastName: created.customer.lastName,
      preferredName: created.customer.preferredName,
      whatsappName: created.customer.whatsappName,
      displayName: created.customer.displayName,
      phone: created.customer.phone,
      secondaryPhone: created.customer.secondaryPhone,
      email: created.customer.email,
      countryCode: created.customer.countryCode,
      secondaryCountryCode: created.customer.secondaryCountryCode,
      createdAt: created.customer.createdAt,
      updatedAt: created.customer.updatedAt,
    },
  };
}

export function isHardBlocked(cluster: CustomerCluster): boolean {
  if (cluster === "has_appointment") {
    return true;
  }

  if (cluster === "do_not_notify") {
    return true;
  }

  return false;
}

export function isCooldownCluster(cluster: CustomerCluster): boolean {
  if (cluster === "cooldown") {
    return true;
  }

  return false;
}

export function sortCustomersForSmartSelection(
  items: CustomerListItem[]
): CustomerListItem[] {
  const availableItems = items.filter((item) => item.cluster === "available");

  return [...availableItems].sort((a, b) => {
    const aHasHistory = !!a.lastAppointmentAt;
    const bHasHistory = !!b.lastAppointmentAt;

    if (!aHasHistory && bHasHistory) {
      return -1;
    }

    if (aHasHistory && !bHasHistory) {
      return 1;
    }

    if (!aHasHistory && !bHasHistory) {
      return 0;
    }

    const aTime = new Date(a.lastAppointmentAt as string).getTime();
    const bTime = new Date(b.lastAppointmentAt as string).getTime();

    return aTime - bTime;
  });
}

export function buildSmartSelectionIds(items: CustomerListItem[]): string[] {
  return sortCustomersForSmartSelection(items)
    .slice(0, MAX_SELECTED_CONTACTS)
    .map((item) => item.customerId);
}