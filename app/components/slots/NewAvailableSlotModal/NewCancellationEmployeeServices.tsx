// app/components/slots/NewAvailableSlotModal/NewCancellationEmployeeServices.tsx
"use client";

type EmployeeServiceItem = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

type NewCancellationEmployeeServicesProps = {
  employeeId: string;
  services: EmployeeServiceItem[];
  selectedServiceIds: string[];
  invalidServiceIds: string[];
  onChange: (services: EmployeeServiceItem[], selectedIds: string[]) => void;
};

export function NewCancellationEmployeeServices({
  employeeId,
  services,
  selectedServiceIds,
  invalidServiceIds,
  onChange,
}: NewCancellationEmployeeServicesProps) {
  function handleToggle(serviceId: string) {
    const exists = selectedServiceIds.includes(serviceId);

    let nextSelectedIds: string[];

    if (exists) {
      nextSelectedIds = selectedServiceIds.filter((id) => {
        return id !== serviceId;
      });
    } else {
      nextSelectedIds = [...selectedServiceIds, serviceId];
    }

    onChange(services, nextSelectedIds);
  }

  if (!employeeId) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Servicios del empleado</p>

        <div className="flex min-h-[72px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          Selecciona un empleado para ver sus servicios.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Servicios del empleado</p>

      <div className="flex min-h-[72px] flex-wrap content-start items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        {services.map((service) => {
          const isSelected = selectedServiceIds.includes(service.id);
          const isInvalid = invalidServiceIds.includes(service.id);

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => handleToggle(service.id)}
              className={
                isInvalid
                  ? "inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 transition"
                  : isSelected
                    ? "inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 transition"
                    : "inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              }
            >
              <span>{service.name}</span>

              <span className="rounded-full bg-white/75 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                {service.durationMin} min
              </span>

              <span className="rounded-full bg-white/75 px-1.5 py-0.5 text-[12px] font-semibold text-slate-700">
                {Math.round(service.price)} €
              </span>
            </button>
          );
        })}

        {services.length === 0 ? (
          <div className="text-sm text-slate-500">
            Este empleado no tiene servicios asignados.
          </div>
        ) : null}
      </div>
    </div>
  );
}