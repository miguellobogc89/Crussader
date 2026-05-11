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
  nextAppointmentAt: string | null;
  nextAppointmentServiceName: string | null;
  lastAppointmentServiceName: string | null;
  waitlist: {
    id: string;
    isUrgent: boolean;
    serviceName: string | null;
    note: string | null;
    createdAt: string | Date;
  } | null;
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

export const DEFAULT_EXPANDED_CLUSTERS: Record<CustomerCluster, boolean> = {
  available: true,
  cooldown: false,
  has_appointment: false,
  do_not_notify: false,
};

export const CLUSTER_ORDER: CustomerCluster[] = [
  "available",
  "cooldown",
  "has_appointment",
  "do_not_notify",
];

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

export function formatLastAppointmentDate(value: string | null): string {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

export function getGroupedItems(items: CustomerListItem[]) {
  return {
    available: items.filter((item) => item.cluster === "available"),
    cooldown: items.filter((item) => item.cluster === "cooldown"),
    has_appointment: items.filter((item) => item.cluster === "has_appointment"),
    do_not_notify: items.filter((item) => item.cluster === "do_not_notify"),
  };
}

export function filterCustomerItems(
  items: CustomerListItem[],
  query: string
): CustomerListItem[] {
  const q = query.toLowerCase().trim();

  if (!q) {
    return items;
  }

  return items.filter((item) => {
    const displayName = item.customer.displayName.toLowerCase();
    const firstName = item.customer.firstName?.toLowerCase() || "";
    const lastName = item.customer.lastName?.toLowerCase() || "";
    const phone = getFullPhone(item).toLowerCase();

    if (displayName.includes(q)) {
      return true;
    }

    if (firstName.includes(q)) {
      return true;
    }

    if (lastName.includes(q)) {
      return true;
    }

    if (phone.includes(q)) {
      return true;
    }

    return false;
  });
}

export function getSelectableIds(items: CustomerListItem[]): string[] {
  const ids: string[] = [];

  for (const item of items) {
    if (!item.customerId) {
      continue;
    }

    if (isHardBlocked(item.cluster)) {
      continue;
    }

    ids.push(item.customerId);
  }

  return ids;
}

export function buildSelectedSummary(
  selectedCount: number,
  totalCount: number
): string {
  if (totalCount === 0) {
    return "Sin contactos cargados";
  }

  return `${selectedCount} de ${totalCount} seleccionados`;
}

export function buildSendButtonLabel(selectedCount: number): string {
  if (selectedCount === 1) {
    return "Enviar a 1 contacto";
  }

  return `Enviar a ${selectedCount} contactos`;
}

export function getCreateContactDisabled(params: {
  creatingContact: boolean;
  newFirstName: string;
  newPhone: string;
}): boolean {
  if (params.creatingContact) {
    return true;
  }

  if (!params.newFirstName.trim()) {
    return true;
  }

  if (!params.newPhone.trim()) {
    return true;
  }

  return false;
}

export function getSendDisabled(params: {
  selectedCount: number;
  sending: boolean;
}): boolean {
  if (params.selectedCount === 0) {
    return true;
  }

  if (params.sending) {
    return true;
  }

  return false;
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
    nextAppointmentAt: null,
nextAppointmentServiceName: null,
    waitlist: null,
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

export function getItemTitle(item: CustomerListItem): string | undefined {
  if (!item.customerId) {
    return "Entrada de lista de espera sin cliente enlazado";
  }

  if (isCooldownCluster(item.cluster)) {
    return "Contacto notificado recientemente";
  }

  return undefined;
}

export function getItemDisabled(item: CustomerListItem): boolean {
  if (!item.customerId) {
    return true;
  }

  if (isHardBlocked(item.cluster)) {
    return true;
  }

  return false;
}

export function getItemRowClassName(params: {
  isSelected: boolean;
  isDisabled: boolean;
}): string {
  let className =
    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150";

  if (params.isSelected) {
    className += " border-crussader/20 bg-crussader/5";
  }

  if (!params.isSelected) {
    className += " border-transparent hover:bg-muted/60";
  }

  if (params.isDisabled) {
    className += " opacity-50";
  }

  return className;
}

export function getCheckboxClassName(params: {
  isSelected: boolean;
  isCooldown: boolean;
}): string {
  let className =
    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150";

  if (params.isSelected) {
    className += " border-crussader bg-crussader";
  }

  if (!params.isSelected) {
    className += " border-border bg-white";
  }

  if (params.isCooldown) {
    if (params.isSelected) {
      return "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-orange-500 bg-orange-500 transition-all duration-150";
    }

    return "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-orange-400 bg-white transition-all duration-150";
  }

  return className;
}

export function buildSmartSelectionIds(items: CustomerListItem[]): string[] {
  const selectable = items.filter((item) => {
    if (!item.customerId) {
      return false;
    }

    if (isHardBlocked(item.cluster)) {
      return false;
    }

    return true;
  });

  const urgentWaitlist = selectable.filter((item) => item.waitlist?.isUrgent);

  if (urgentWaitlist.length > 0) {
    return urgentWaitlist.slice(0, 1).map((item) => item.customerId!);
  }

  const normalWaitlist = selectable.filter((item) => {
    if (!item.waitlist) {
      return false;
    }

    if (item.waitlist.isUrgent) {
      return false;
    }

    return true;
  });

  if (normalWaitlist.length > 0) {
    return normalWaitlist.slice(0, 3).map((item) => item.customerId!);
  }

  return selectable
    .slice(0, MAX_SELECTED_CONTACTS)
    .map((item) => item.customerId!);
}