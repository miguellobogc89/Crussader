// app/components/slots/configuration/employees/EmployeesShell.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmployeesPanel } from "./EmployeesPanel";
import { EmployeeAssignedServicesPanel } from "../employeeServices/EmployeeAssignedServicesPanel";
import { CreateEmployeePanel } from "./CreateEmployeePanel";

export type EmployeeItem = {
  id: string;
  name: string;
  role: string;
  colorClass: string;
};

type AssignedEmployeeServiceItem = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

type EmployeesShellProps = {
  locationId: string;
  selectedEmployeeId: string;
  onSelectEmployee: (employeeId: string) => void;
  onSelectedEmployeeNameChange: (employeeName: string) => void;
  pendingAssignedServices: AssignedEmployeeServiceItem[];
  pendingRemovedServiceIds?: string[];
  onUnassignService?: (serviceId: string) => void;
  isUpdating?: boolean;
  updateErrorText?: string;
  mode: "list" | "assigned";
};

const EMPLOYEES_LIST_ENDPOINT = "/api/slots/employees/list";
const EMPLOYEE_SERVICES_LIST_ENDPOINT = "/api/slots/employees/services/list";

export function EmployeesShell({
  locationId,
  selectedEmployeeId,
  onSelectEmployee,
  onSelectedEmployeeNameChange,
  pendingAssignedServices,
  pendingRemovedServiceIds = [],
  onUnassignService,
  isUpdating = false,
  updateErrorText = "",
  mode,
}: EmployeesShellProps) {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeesErrorText, setEmployeesErrorText] = useState("");
  const [employeeQuery, setEmployeeQuery] = useState("");

  const selectedEmployeeIdRef = useRef(selectedEmployeeId);

  const [assignedServices, setAssignedServices] = useState<
    AssignedEmployeeServiceItem[]
  >([]);
  const [loadingAssignedServices, setLoadingAssignedServices] = useState(false);
  const [assignedServicesErrorText, setAssignedServicesErrorText] =
    useState("");

  useEffect(() => {
    selectedEmployeeIdRef.current = selectedEmployeeId;
  }, [selectedEmployeeId]);

  const loadEmployees = useCallback(
    async (signal?: AbortSignal) => {
      if (!locationId) {
        setEmployees([]);
        setEmployeesErrorText("Selecciona una ubicación.");
        onSelectEmployee("");
        return;
      }

      try {
        setLoadingEmployees(true);
        setEmployeesErrorText("");

        const params = new URLSearchParams({ locationId });

        const response = await fetch(
          `${EMPLOYEES_LIST_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data?.ok) {
          setEmployees([]);
          onSelectEmployee("");
          setEmployeesErrorText(
            data?.error || "No se pudieron cargar los empleados.",
          );
          setLoadingEmployees(false);
          return;
        }

        const nextEmployees: EmployeeItem[] = Array.isArray(data.employees)
          ? data.employees.map((item: any) => {
              return {
                id: String(item.id || ""),
                name: String(item.name || ""),
                role: String(item.role || "Sin especialidad"),
                colorClass: String(item.color || ""),
              };
            })
          : [];

        setEmployees(nextEmployees);

        const currentSelectedEmployeeId = selectedEmployeeIdRef.current;

        const currentExists = nextEmployees.some((employee) => {
          return employee.id === currentSelectedEmployeeId;
        });

        let nextSelectedId = "";

        if (currentExists) {
          nextSelectedId = currentSelectedEmployeeId;
        } else {
          nextSelectedId = nextEmployees[0]?.id ?? "";
        }

        onSelectEmployee(nextSelectedId);
        setLoadingEmployees(false);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("[EmployeesShell] loadEmployees", error);
        setEmployees([]);
        onSelectEmployee("");
        setEmployeesErrorText("No se pudieron cargar los empleados.");
        setLoadingEmployees(false);
      }
    },
    [locationId, onSelectEmployee],
  );

  const loadAssignedServices = useCallback(
    async (employeeId: string, signal?: AbortSignal) => {
      if (!employeeId) {
        setAssignedServices([]);
        setAssignedServicesErrorText("");
        return;
      }

      try {
        setLoadingAssignedServices(true);
        setAssignedServicesErrorText("");

        const params = new URLSearchParams({ employeeId });

        const response = await fetch(
          `${EMPLOYEE_SERVICES_LIST_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data?.ok) {
          setAssignedServices([]);
          setAssignedServicesErrorText(
            data?.error || "No se pudieron cargar los servicios asignados.",
          );
          setLoadingAssignedServices(false);
          return;
        }

        const nextServices: AssignedEmployeeServiceItem[] = Array.isArray(
          data.services,
        )
          ? data.services.map((item: any) => {
              return {
                id: String(item.id || ""),
                name: String(item.name || ""),
                durationMin: Number(item.durationMin || 0),
                price: Number(item.price || 0),
                active: Boolean(item.active ?? true),
              };
            })
          : [];

        setAssignedServices(nextServices);
        setLoadingAssignedServices(false);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("[EmployeesShell] loadAssignedServices", error);
        setAssignedServices([]);
        setAssignedServicesErrorText(
          "No se pudieron cargar los servicios asignados.",
        );
        setLoadingAssignedServices(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadEmployees(controller.signal);
    return () => controller.abort();
  }, [loadEmployees]);

  useEffect(() => {
    const controller = new AbortController();
    loadAssignedServices(selectedEmployeeId, controller.signal);
    return () => controller.abort();
  }, [selectedEmployeeId, loadAssignedServices]);

  const filteredEmployees = useMemo(() => {
    const normalized = employeeQuery.trim().toLowerCase();

    if (!normalized) {
      return employees;
    }

    return employees.filter((employee) => {
      return (
        employee.name.toLowerCase().includes(normalized) ||
        employee.role.toLowerCase().includes(normalized)
      );
    });
  }, [employeeQuery, employees]);

  const selectedEmployee = useMemo(() => {
    return employees.find((employee) => {
      return employee.id === selectedEmployeeId;
    });
  }, [employees, selectedEmployeeId]);

  useEffect(() => {
    onSelectedEmployeeNameChange(selectedEmployee?.name ?? "");
  }, [onSelectedEmployeeNameChange, selectedEmployee]);

  const mergedAssignedServices = useMemo(() => {
    const removedIds = new Set(pendingRemovedServiceIds);
    const map = new Map<string, AssignedEmployeeServiceItem>();

    assignedServices.forEach((service) => {
      if (!removedIds.has(service.id)) {
        map.set(service.id, service);
      }
    });

    pendingAssignedServices.forEach((service) => {
      if (!removedIds.has(service.id)) {
        map.set(service.id, service);
      }
    });

    return Array.from(map.values());
  }, [assignedServices, pendingAssignedServices, pendingRemovedServiceIds]);

  if (mode === "list") {
    return (
      <EmployeesPanel
        employees={filteredEmployees}
        selectedEmployeeId={selectedEmployeeId}
        employeeQuery={employeeQuery}
        onSelectEmployee={onSelectEmployee}
        onEmployeeQueryChange={setEmployeeQuery}
        loading={loadingEmployees}
        errorText={employeesErrorText}
        actionSlot={
          <CreateEmployeePanel
            locationId={locationId}
            onCreateEmployee={async () => {}}
          />
        }
      />
    );
  }

  return (
    <EmployeeAssignedServicesPanel
      employeeName={selectedEmployee?.name ?? ""}
      services={mergedAssignedServices}
      loading={loadingAssignedServices}
      errorText={assignedServicesErrorText || updateErrorText}
      onUnassignService={onUnassignService}
      disabled={isUpdating}
      isUpdating={isUpdating}
    />
  );
}