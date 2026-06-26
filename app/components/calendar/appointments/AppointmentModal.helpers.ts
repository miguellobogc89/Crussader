// app/components/calendar/appointments/AppointmentModal.helpers.ts
import type { SearchablePickerItem } from "@/app/components/crussader/UX/inputs";

export type ServiceLite = {
  id: string;
  name: string;
  durationMin?: number;
  price?: number;
  priceCents?: number;
  active?: boolean;
};

export type EmployeeLite = {
  id: string;
  name: string;
  role?: string;
  color?: string;
  isPrimary?: boolean;
};

export type EmployeeServiceItem = ServiceLite & {
  employeeId: string;
};

export type AppointmentStatusValue =
  | "PENDING"
  | "BOOKED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export const STATUS_OPTIONS: {
  value: AppointmentStatusValue;
  label: string;
}[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "BOOKED", label: "Confirmada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "NO_SHOW", label: "No asistió" },
  { value: "CANCELLED", label: "Cancelada" },
];

export function normalizeStatus(value: unknown): AppointmentStatusValue {
  if (
    value === "PENDING" ||
    value === "BOOKED" ||
    value === "COMPLETED" ||
    value === "CANCELLED" ||
    value === "NO_SHOW"
  ) {
    return value;
  }

  return "BOOKED";
}

export function getDateValueFromISO(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-CA");
}

export function getTimeValueFromISO(value: string): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function buildIsoFromLocal(
  dateValue: string,
  timeValue: string
): string | null {
  if (!dateValue || !timeValue) {
    return null;
  }

  const date = new Date(`${dateValue}T${timeValue}:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export function mapServicesResponse(json: any): ServiceLite[] {
  if (!Array.isArray(json?.items)) {
    return [];
  }

  return json.items.map((item: any) => {
    return {
      id: String(item.id),
      name: String(item.name ?? "Servicio"),
      durationMin: Number(item.durationMin ?? item.duration_min ?? 0),
      price: Number(item.price ?? item.price_cents ?? 0),
      priceCents: Number(item.priceCents ?? item.price_cents ?? 0),
      active: item.active ?? true,
    };
  });
}

export function mapEmployeesResponse(json: any): EmployeeLite[] {
  if (!Array.isArray(json?.items)) {
    return [];
  }

  return json.items.map((item: any) => {
    return {
      id: String(item.id),
      name: String(item.name ?? item.fullName ?? "Empleado"),
      role: item.role ?? "",
      color: item.color ?? "#94A3B8",
      isPrimary: Boolean(item.isPrimary),
    };
  });
}

export function mapEmployeeServicesResponse(json: any): EmployeeServiceItem[] {
  if (!Array.isArray(json?.services)) {
    return [];
  }

  return json.services.map((item: any) => {
    return {
      id: String(item.id),
      name: String(item.name ?? "Servicio"),
      employeeId: String(item.employeeId),
      durationMin: Number(item.durationMin ?? 0),
      price: Number(item.price ?? 0),
      active: item.active ?? true,
    };
  });
}

export function buildServicePickerItems(
  services: ServiceLite[]
): SearchablePickerItem[] {
  return services.map((service) => {
    return {
      id: service.id,
      label: service.name,
      description: service.durationMin ? `${service.durationMin} min` : null,
      searchText: `${service.name} ${service.durationMin ?? ""}`,
    };
  });
}

export function getSelectedService(
  services: ServiceLite[],
  serviceId: string
): ServiceLite | null {
  return services.find((service) => service.id === serviceId) ?? null;
}

export function getCompatibleEmployees(params: {
  employees: EmployeeLite[];
  employeeServices: EmployeeServiceItem[];
  serviceId: string;
}): EmployeeLite[] {
  const { employees, employeeServices, serviceId } = params;

  if (!serviceId) {
    return employees;
  }

  const compatibleEmployeeIds = new Set(
    employeeServices
      .filter((item) => item.id === serviceId)
      .map((item) => item.employeeId)
  );

  return employees.filter((employee) => {
    return compatibleEmployeeIds.has(employee.id);
  });
}

export function getAvailableServicePickerItems(params: {
  servicePickerItems: SearchablePickerItem[];
  employeeServices: EmployeeServiceItem[];
  employeeId: string;
}): SearchablePickerItem[] {
  const { servicePickerItems, employeeServices, employeeId } = params;

  if (!employeeId) {
    return servicePickerItems;
  }

  const employeeServiceIds = new Set(
    employeeServices
      .filter((item) => item.employeeId === employeeId)
      .map((item) => item.id)
  );

  return servicePickerItems.filter((service) => {
    return employeeServiceIds.has(service.id);
  });
}

export function isServiceAvailableForEmployee(params: {
  employeeServices: EmployeeServiceItem[];
  employeeId: string;
  serviceId: string;
}): boolean {
  const { employeeServices, employeeId, serviceId } = params;

  return employeeServices.some((item) => {
    return item.employeeId === employeeId && item.id === serviceId;
  });
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "P";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function buildAppointmentOptionsParams(params: {
  companyId: string;
  locationId: string;
}) {
  const servicesParams = new URLSearchParams();
  servicesParams.set("companyId", params.companyId);

  const employeesParams = new URLSearchParams();
  employeesParams.set("locationId", params.locationId);

  const employeeServicesParams = new URLSearchParams();
  employeeServicesParams.set("locationId", params.locationId);

  return {
    servicesUrl: `/api/service?${servicesParams.toString()}`,
    employeesUrl: `/api/employee?${employeesParams.toString()}`,
    employeeServicesUrl: `/api/slots/employees/services/list?${employeeServicesParams.toString()}`,
  };
}
