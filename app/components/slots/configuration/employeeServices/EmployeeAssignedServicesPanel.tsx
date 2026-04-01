// app/components/slots/configuration/employeeServices/EmployeeAssignedServicesPanel.tsx
"use client";

type AssignedEmployeeServiceItem = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

type EmployeeAssignedServicesPanelProps = {
  employeeName: string;
  services: AssignedEmployeeServiceItem[];
  loading?: boolean;
  errorText?: string;
  onUnassignService?: (serviceId: string) => void;
  disabled?: boolean;
  isUpdating?: boolean;
};

export function EmployeeAssignedServicesPanel({
  employeeName,
  services,
  loading = false,
  errorText = "",
  onUnassignService,
  disabled = false,
  isUpdating = false,
}: EmployeeAssignedServicesPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-900">
          Servicios asignados
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {employeeName || "Selecciona un empleado"}
        </p>
      </div>



      <div className="min-h-0 flex-1 overflow-auto pr-1">


        {!loading && errorText ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorText}
          </div>
        ) : null}

        {!loading && !errorText ? (
          <div className="space-y-2">
            {services.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Este empleado no tiene servicios asignados.
              </div>
            ) : null}

            {services.map((service) => {
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => onUnassignService?.(service.id)}
                  disabled={disabled}
                  className={[
                    "w-full rounded-2xl border px-4 py-3 text-left transition",
                    disabled
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                      : "border-slate-200 bg-slate-50 hover:border-rose-200 hover:bg-rose-50",
                  ].join(" ")}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {service.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {service.durationMin} min · {service.price} €
                  </p>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}