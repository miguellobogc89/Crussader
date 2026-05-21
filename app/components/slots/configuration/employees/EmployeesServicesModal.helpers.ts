// app/components/slots/configuration/employees/EmployeesServicesModal.helpers.ts
import type { ServiceItem } from "../services/ServicesShell";

export type AssignedEmployeeServiceItem = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

export const EMPLOYEE_SERVICE_UPDATE_ENDPOINT =
  "/api/slots/employees/services/update";

export async function persistEmployeeService(
  employeeId: string,
  serviceId: string,
  action: "assign" | "unassign",
) {
  const response = await fetch(EMPLOYEE_SERVICE_UPDATE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      employeeId,
      serviceId,
      action,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "No se pudo actualizar la asignación.");
  }
}

export function buildAssignedEmployeeServiceItem(
  service: ServiceItem,
): AssignedEmployeeServiceItem {
  return {
    id: service.id,
    name: service.name,
    durationMin: service.durationMin,
    price: service.price,
    active: service.active,
  };
}

export function getAssignedServicesForEmployee(
  map: Record<string, AssignedEmployeeServiceItem[]>,
  employeeId: string,
): AssignedEmployeeServiceItem[] {
  if (!employeeId) {
    return [];
  }

  return map[employeeId] ?? [];
}

export function getRemovedServiceIdsForEmployee(
  map: Record<string, string[]>,
  employeeId: string,
): string[] {
  if (!employeeId) {
    return [];
  }

  return map[employeeId] ?? [];
}

export function getIsUpdatingForEmployee(
  map: Record<string, boolean>,
  employeeId: string,
): boolean {
  if (!employeeId) {
    return false;
  }

  return Boolean(map[employeeId]);
}

export function getUpdateErrorForEmployee(
  map: Record<string, string>,
  employeeId: string,
): string {
  if (!employeeId) {
    return "";
  }

  return map[employeeId] ?? "";
}