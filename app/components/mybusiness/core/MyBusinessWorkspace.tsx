// app/components/mybusiness/core/MyBusinessWorkspace.tsx
"use client";

import { useMemo, useState } from "react";
import { Users, Wrench } from "lucide-react";
import EmployeesTable from "../employees/EmployeesTable";
import ServicesTable from "../services/ServicesTable";
import MyBusinessDetailPanel from "./MyBusinessDetailPanel";

export type EmployeeItem = {
  id: string;
  name: string;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  color: string | null;
  invitedAt: string | null;
  joinedAt: string | null;
  jobTitle: string | null;
  active: boolean;
  primaryLocation: string | null;
  primaryRoleName: string | null;
  primaryRoleColor: string | null;
  locations: Array<{
    id: string;
    title: string;
    city: string | null;
    isPrimary: boolean;
  }>;
  services: Array<{
    id: string;
    name: string;
    durationMin: number | null;
    price: any;
    active: boolean;
  }>;
};

export type ServiceItem = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
  employeeCount: number;
};

type Props = {
  employees: EmployeeItem[];
};

type ActiveTab = "employees" | "services";

export default function MyBusinessWorkspace({ employees }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("employees");
  const [localEmployees, setLocalEmployees] = useState<EmployeeItem[]>(employees);
  const [localServices, setLocalServices] = useState<ServiceItem[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    employees[0]?.id ?? null,
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );

  const derivedServices = useMemo<ServiceItem[]>(() => {
    const map = new Map<string, ServiceItem>();

    localEmployees.forEach((employee) => {
      employee.services.forEach((service) => {
        const current = map.get(service.id);

        if (current) {
          map.set(service.id, {
            ...current,
            employeeCount: current.employeeCount + 1,
          });
          return;
        }

        map.set(service.id, {
          id: service.id,
          name: service.name,
          durationMin: service.durationMin ?? 0,
          price: Number(service.price ?? 0),
          active: service.active,
          employeeCount: 1,
        });
      });
    });

    return Array.from(map.values());
  }, [localEmployees]);

  const services = localServices.length > 0 ? localServices : derivedServices;

  const selectedEmployee =
    localEmployees.find((employee) => employee.id === selectedEmployeeId) ??
    localEmployees[0] ??
    null;

  const selectedService =
    services.find((service) => service.id === selectedServiceId) ??
    services[0] ??
    null;

  function handleSelectEmployee(employeeId: string) {
    setActiveTab("employees");
    setSelectedEmployeeId(employeeId);
  }

  function handleSelectService(serviceId: string) {
    setActiveTab("services");
    setSelectedServiceId(serviceId);
  }

  async function handleUpdateEmployee(
    employeeId: string,
    patch: Partial<EmployeeItem>,
  ) {
    setLocalEmployees((current) =>
      current.map((employee) => {
        if (employee.id !== employeeId) {
          return employee;
        }

        return {
          ...employee,
          ...patch,
        };
      }),
    );

    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }

  async function handleUpdateService(
    serviceId: string,
    patch: Partial<ServiceItem>,
  ) {
    setLocalServices((current) => {
      const base = current.length > 0 ? current : derivedServices;

      return base.map((service) => {
        if (service.id !== serviceId) {
          return service;
        }

        return {
          ...service,
          ...patch,
        };
      });
    });

    setLocalEmployees((current) =>
      current.map((employee) => ({
        ...employee,
        services: employee.services.map((service) => {
          if (service.id !== serviceId) {
            return service;
          }

          return {
            ...service,
            name:
              typeof patch.name === "string"
                ? patch.name
                : service.name,
            durationMin:
              typeof patch.durationMin === "number"
                ? patch.durationMin
                : service.durationMin,
            price:
              typeof patch.price === "number"
                ? patch.price
                : service.price,
            active:
              typeof patch.active === "boolean"
                ? patch.active
                : service.active,
          };
        }),
      })),
    );

    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }

  async function handleToggleEmployeeService(
  employeeId: string,
  serviceId: string,
  checked: boolean,
) {
  const service = services.find((item) => item.id === serviceId);

  if (!service) {
    return;
  }

  setLocalEmployees((current) =>
    current.map((employee) => {
      if (employee.id !== employeeId) {
        return employee;
      }

      const alreadyAssigned = employee.services.some(
        (item) => item.id === serviceId,
      );

      if (checked && alreadyAssigned) {
        return employee;
      }

      if (!checked && !alreadyAssigned) {
        return employee;
      }

      if (checked) {
        return {
          ...employee,
          services: [
            ...employee.services,
            {
              id: service.id,
              name: service.name,
              durationMin: service.durationMin,
              price: service.price,
              active: service.active,
            },
          ],
        };
      }

      return {
        ...employee,
        services: employee.services.filter((item) => item.id !== serviceId),
      };
    }),
  );

  await new Promise((resolve) => window.setTimeout(resolve, 400));
}

  return (
    <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_380px]">
        <section className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-slate-200 px-4">
<div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
  <button
    type="button"
    onClick={() => setActiveTab("employees")}
    className={[
      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
      activeTab === "employees"
        ? "bg-white text-slate-900 shadow-sm"
        : "text-slate-500 hover:text-slate-800",
    ].join(" ")}
  >
    <Users className="h-4 w-4" />
    Empleados
  </button>

  <button
    type="button"
    onClick={() => setActiveTab("services")}
    className={[
      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
      activeTab === "services"
        ? "bg-white text-slate-900 shadow-sm"
        : "text-slate-500 hover:text-slate-800",
    ].join(" ")}
  >
    <Wrench className="h-4 w-4" />
    Servicios
  </button>
</div>

            <button
              type="button"
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Nuevo {activeTab === "employees" ? "empleado" : "servicio"}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {activeTab === "employees" ? (
              <EmployeesTable
                employees={localEmployees}
                selectedEmployeeId={selectedEmployee?.id ?? null}
                onSelectEmployee={handleSelectEmployee}
              />
            ) : (
              <ServicesTable
                services={services}
                selectedServiceId={selectedService?.id ?? null}
                onSelectService={handleSelectService}
              />
            )}
          </div>
        </section>

<MyBusinessDetailPanel
  activeTab={activeTab}
  employee={selectedEmployee}
  service={selectedService}
  employees={localEmployees}
  services={services}
  onUpdateEmployee={handleUpdateEmployee}
  onUpdateService={handleUpdateService}
  onToggleEmployeeService={handleToggleEmployeeService}
/>
      </div>
    </div>
  );
}