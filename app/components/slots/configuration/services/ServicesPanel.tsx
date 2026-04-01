// app/components/slots/configuration/services/ServicesPanel.tsx
"use client";

import { Search, Scissors } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import type { ServiceItem } from "./ServicesShell";

type ServicesPanelProps = {
  services: ServiceItem[];
  selectedServiceId: string;
  serviceQuery: string;
  onSelectService: (serviceId: string) => void;
  onServiceQueryChange: (value: string) => void;
  loading?: boolean;
  errorText?: string;
  actionSlot?: React.ReactNode;
  selectedEmployeeId?: string;
  selectedEmployeeName?: string;
  disabled?: boolean;
  isUpdating?: boolean;
};

export function ServicesPanel({
  services,
  selectedServiceId,
  serviceQuery,
  onSelectService,
  onServiceQueryChange,
  loading = false,
  errorText = "",
  actionSlot,
  selectedEmployeeId = "",
  selectedEmployeeName = "",
  disabled = false,
  isUpdating = false,
}: ServicesPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <Scissors className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Servicios</p>
          <p className="text-xs text-slate-500">Haz clic para asignarlo</p>
        </div>
      </div>

      <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
        {selectedEmployeeId
          ? `Asignando a: ${selectedEmployeeName || "Empleado seleccionado"}`
          : "Selecciona primero un empleado"}
      </div>



      <div className="mb-4 flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={serviceQuery}
            onChange={(event) => onServiceQueryChange(event.target.value)}
            placeholder="Buscar servicio..."
            className="h-10 w-full rounded-2xl border-slate-200 bg-white pl-9"
            disabled={disabled}
          />
        </div>

        <div className="shrink-0">{actionSlot}</div>
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
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                No hay servicios disponibles para este empleado.
              </div>
            ) : null}

            {services.map((service) => {
              const isSelected = service.id === selectedServiceId;

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => onSelectService(service.id)}
                  disabled={!selectedEmployeeId || disabled}
                  className={[
                    "w-full rounded-2xl border p-3 text-left transition",
                    !selectedEmployeeId || disabled
                      ? "cursor-not-allowed border-slate-200 bg-slate-100/70 opacity-60"
                      : isSelected
                        ? "border-sky-300 bg-white shadow-[0_8px_24px_rgba(14,165,233,0.10)]"
                        : "border-transparent bg-white/70 hover:border-slate-200 hover:bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {service.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {service.durationMin} min · {service.price} €
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}