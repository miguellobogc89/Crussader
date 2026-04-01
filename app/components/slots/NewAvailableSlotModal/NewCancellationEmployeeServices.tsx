// app/components/slots/NewAvailableSlotModal/NewCancellationEmployeeServices.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type EmployeeServiceItem = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

type NewCancellationEmployeeServicesProps = {
  employeeId: string;
  selectedServiceIds: string[];
  onChange: (services: EmployeeServiceItem[], selectedIds: string[]) => void;
};

export function NewCancellationEmployeeServices({
  employeeId,
  selectedServiceIds,
  onChange,
}: NewCancellationEmployeeServicesProps) {
  const [services, setServices] = useState<EmployeeServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastEmployeeIdRef = useRef("");

  useEffect(() => {
    if (!employeeId) {
      setServices([]);
      setIsLoading(false);
      lastEmployeeIdRef.current = "";
      onChange([], []);
      return;
    }

    let cancelled = false;

    async function loadServices() {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/slots/employees/services/list?employeeId=${encodeURIComponent(employeeId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok || !data?.ok || !Array.isArray(data?.services)) {
          setServices([]);
          onChange([], []);
          return;
        }

        const nextServices: EmployeeServiceItem[] = data.services.map(
          (item: any) => {
            return {
              id: String(item.id),
              name: String(item.name),
              durationMin: Number(item.durationMin ?? 0),
              price: Number(item.price ?? 0),
              active: Boolean(item.active),
            };
          }
        );

        setServices(nextServices);

        const nextSelectedIds = nextServices.map((service) => {
          return service.id;
        });

        lastEmployeeIdRef.current = employeeId;
        onChange(nextServices, nextSelectedIds);
      } catch (error) {
        console.error("[NewCancellationEmployeeServices]", error);

        if (!cancelled) {
          setServices([]);
          onChange([], []);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      cancelled = true;
    };
  }, [employeeId, onChange]);

  function handleToggle(serviceId: string) {
    const exists = selectedServiceIds.includes(serviceId);

    const nextSelectedIds = exists
      ? selectedServiceIds.filter((id) => {
          return id !== serviceId;
        })
      : [...selectedServiceIds, serviceId];

    onChange(services, nextSelectedIds);
  }

  if (!employeeId) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Servicios del empleado</p>

      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
            Cargando servicios...
          </div>
        ) : null}

        {!isLoading &&
          services.map((service) => {
            const isSelected = selectedServiceIds.includes(service.id);

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => handleToggle(service.id)}
                className={
                  isSelected
                    ? "rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 transition"
                    : "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 transition"
                }
              >
                {service.name}
              </button>
            );
          })}

        {!isLoading && services.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            Este empleado no tiene servicios asignados.
          </div>
        ) : null}
      </div>
    </div>
  );
}