// app/components/mybusiness/core/MyBusinessDetailPanel.tsx
"use client";

import { useState } from "react";
import EditableDetailField from "./EditableDetailField";
import type { EmployeeItem, ServiceItem } from "./MyBusinessWorkspace";

type Props = {
  activeTab: "employees" | "services";
  employee: EmployeeItem | null;
  service: ServiceItem | null;
  employees: EmployeeItem[];
  onUpdateEmployee: (
    employeeId: string,
    patch: Partial<EmployeeItem>,
  ) => Promise<void> | void;
  onUpdateService: (
    serviceId: string,
    patch: Partial<ServiceItem>,
  ) => Promise<void> | void;
  services: ServiceItem[];
onToggleEmployeeService: (
  employeeId: string,
  serviceId: string,
  checked: boolean,
) => Promise<void> | void;
};

export default function MyBusinessDetailPanel({
  activeTab,
  employee,
  service,
  employees,
  onUpdateEmployee,
  onUpdateService,
  services,
onToggleEmployeeService,
}: Props) {
  if (activeTab === "employees") {
    return (
      <aside className="flex min-h-0 flex-col overflow-hidden border-l border-slate-200 bg-white">
        <PanelHeader
          title={employee?.name ?? "Empleado"}
          subtitle="Datos y servicios asignados"
        />

        <div className="min-h-0 flex-1 space-y-5 overflow-auto p-4">
          {!employee ? (
            <EmptyState text="Selecciona un empleado para ver el detalle." />
          ) : (
            <>
<section className="grid grid-cols-2 gap-x-2 gap-y-1">
  <EditableDetailField
    label="Tratamiento"
    value={employee.title ?? ""}
    onSave={(value) => onUpdateEmployee(employee.id, { title: value })}
  />

  <EditableDetailField
    label="Nombre"
    value={employee.firstName ?? ""}
    onSave={(value) => onUpdateEmployee(employee.id, { firstName: value })}
  />

  <EditableDetailField
    label="Apellidos"
    value={employee.lastName ?? ""}
    onSave={(value) => onUpdateEmployee(employee.id, { lastName: value })}
  />

  <EditableDetailField
    label="Nombre público"
    value={employee.name}
    onSave={(value) => onUpdateEmployee(employee.id, { name: value })}
  />

  <EditableDetailField
    label="Color"
    type="color"
    value={employee.color ?? "#cbd5e1"}
    onSave={(value) => onUpdateEmployee(employee.id, { color: value })}
  />

  <EditableDetailField
    label="Email"
    type="email"
    value={employee.email ?? ""}
    onSave={(value) => onUpdateEmployee(employee.id, { email: value })}
  />

  <EditableDetailField
    label="Teléfono"
    type="tel"
    value={employee.phone ?? ""}
    onSave={(value) => onUpdateEmployee(employee.id, { phone: value })}
  />

  <EditableDetailField
    label="Cargo"
    value={employee.jobTitle ?? ""}
    onSave={(value) => onUpdateEmployee(employee.id, { jobTitle: value })}
  />
</section>



<EmployeeServicesEditor
  employee={employee}
  services={services}
  onToggleEmployeeService={onToggleEmployeeService}
/>
            </>
          )}
        </div>
      </aside>
    );
  }

  const assignedEmployees = employees.filter((employeeItem) =>
    employeeItem.services.some((item) => item.id === service?.id),
  );

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-l border-slate-200 bg-white">
      <PanelHeader
        title={service?.name ?? "Servicio"}
        subtitle="Datos y empleados asignados"
      />

      <div className="min-h-0 flex-1 space-y-5 overflow-auto p-4">
        {!service ? (
          <EmptyState text="Selecciona un servicio para ver el detalle." />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-x-2 gap-y-1">
              <EditableDetailField
                label="Nombre"
                value={service.name}
                onSave={(value) => onUpdateService(service.id, { name: value })}
              />

              <EditableDetailField
                label="Duración"
                type="number"
                value={String(service.durationMin)}
                suffix="min"
                onSave={(value) =>
                  onUpdateService(service.id, {
                    durationMin: Number(value || 0),
                  })
                }
              />

              <EditableDetailField
                label="Precio"
                type="number"
                value={String(service.price)}
                suffix="€"
                onSave={(value) =>
                  onUpdateService(service.id, {
                    price: Number(value || 0),
                  })
                }
              />
            </section>


            <ServiceEmployeesEditor
  service={service}
  employees={employees}
  onToggleEmployeeService={onToggleEmployeeService}
/>
          </>
        )}
      </div>
    </aside>
  );
}

function PanelHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex h-[58px] shrink-0 flex-col justify-center border-b border-slate-200 px-4">
      <h2 className="truncate text-base font-semibold text-slate-900">
        {title}
      </h2>

      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
      {text}
    </div>
  );
}

function EmployeeServicesEditor({
  employee,
  services,
  onToggleEmployeeService,
}: {
  employee: EmployeeItem;
  services: ServiceItem[];
  onToggleEmployeeService: (
    employeeId: string,
    serviceId: string,
    checked: boolean,
  ) => Promise<void> | void;
}) {
  const [showAvailable, setShowAvailable] = useState(false);

  const assignedServices = services.filter((service) =>
    employee.services.some((item) => item.id === service.id),
  );

  const availableServices = services.filter(
    (service) =>
      !employee.services.some((item) => item.id === service.id),
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Servicios asignados
        </h3>

<button
  type="button"
  onClick={() => setShowAvailable((current) => !current)}
  className={[
    "rounded-lg border px-2 py-1 text-xs font-medium transition",
    showAvailable
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : "border-slate-200 text-slate-600 hover:bg-slate-50",
  ].join(" ")}
>
  {showAvailable ? "Cancelar" : "+ Añadir"}
</button>
      </div>

      <div className="space-y-2">
  {assignedServices.map((service) => (
<button
  key={service.id}
  type="button"
  onClick={() => {
    if (!showAvailable) {
      return;
    }

    onToggleEmployeeService(employee.id, service.id, false);
  }}
  className={[
    "flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left transition",
    showAvailable ? "hover:bg-red-50" : "",
  ].join(" ")}
>
            <div>
              <div className="text-sm font-medium text-slate-900">
                {service.name}
              </div>

              <div className="text-xs text-slate-500">
                {service.durationMin} min · {service.price.toFixed(2)} €
              </div>
            </div>

{showAvailable ? (
  <span className="text-xs font-medium text-red-500">
    Quitar
  </span>
) : null}
          </button>
        ))}

        {assignedServices.length === 0 && (
          <EmptyState text="No hay servicios asignados." />
        )}
      </div>

      {showAvailable && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Servicios disponibles
          </div>

          <div className="space-y-2">
            {availableServices.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() =>
                  onToggleEmployeeService(employee.id, service.id, true)
                }
                className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {service.name}
                  </div>

                  <div className="text-xs text-slate-500">
                    {service.durationMin} min · {service.price.toFixed(2)} €
                  </div>
                </div>

                <span className="text-xs font-medium text-blue-600">
                  Añadir
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ServiceEmployeesEditor({
  service,
  employees,
  onToggleEmployeeService,
}: {
  service: ServiceItem;
  employees: EmployeeItem[];
  onToggleEmployeeService: (
    employeeId: string,
    serviceId: string,
    checked: boolean,
  ) => Promise<void> | void;
}) {
  const [showAvailable, setShowAvailable] = useState(false);

  const assignedEmployees = employees.filter((employee) =>
    employee.services.some((item) => item.id === service.id),
  );

  const availableEmployees = employees.filter(
    (employee) =>
      !employee.services.some((item) => item.id === service.id),
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Empleados asignados
        </h3>

        <button
          type="button"
          onClick={() => setShowAvailable((current) => !current)}
          className={[
            "rounded-lg border px-2 py-1 text-xs font-medium transition",
            showAvailable
              ? "border-red-200 text-red-600 hover:bg-red-50"
              : "border-slate-200 text-slate-600 hover:bg-slate-50",
          ].join(" ")}
        >
          {showAvailable ? "Cancelar" : "+ Añadir"}
        </button>
      </div>

      <div className="space-y-2">
        {assignedEmployees.map((employee) => (
          <button
            key={employee.id}
            type="button"
            onClick={() => {
              if (!showAvailable) {
                return;
              }

              onToggleEmployeeService(employee.id, service.id, false);
            }}
            className={[
              "flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left transition",
              showAvailable ? "hover:bg-red-50" : "",
            ].join(" ")}
          >
            <div>
              <div className="text-sm font-medium text-slate-900">
                {employee.name}
              </div>

              <div className="text-xs text-slate-500">
                {employee.jobTitle ?? "Sin cargo"}
              </div>
            </div>

            {showAvailable ? (
              <span className="text-xs font-medium text-red-500">
                Quitar
              </span>
            ) : null}
          </button>
        ))}

        {assignedEmployees.length === 0 && (
          <EmptyState text="No hay empleados asignados." />
        )}
      </div>

      {showAvailable && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Empleados disponibles
          </div>

          <div className="space-y-2">
            {availableEmployees.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() =>
                  onToggleEmployeeService(employee.id, service.id, true)
                }
                className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {employee.name}
                  </div>

                  <div className="text-xs text-slate-500">
                    {employee.jobTitle ?? "Sin cargo"}
                  </div>
                </div>

                <span className="text-xs font-medium text-blue-600">
                  Añadir
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}