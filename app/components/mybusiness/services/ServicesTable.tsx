// app/components/mybusiness/services/ServicesTable.tsx
"use client";

import type { ServiceItem } from "../core/MyBusinessWorkspace";

type Props = {
  services: ServiceItem[];
  selectedServiceId: string | null;
  onSelectService: (serviceId: string) => void;
};

export default function ServicesTable({
  services,
  selectedServiceId,
  onSelectService,
}: Props) {
  return (
    <table className="w-full min-w-[820px] text-left text-sm">
      <thead className="sticky top-0 z-10 border-b bg-slate-50 text-xs uppercase text-slate-500">
        <tr>
          <th className="px-4 py-3">Servicio</th>
          <th className="px-4 py-3">Duración</th>
          <th className="px-4 py-3">Precio</th>
          <th className="px-4 py-3">Empleados</th>
          <th className="px-4 py-3">Estado</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;

          return (
            <tr
              key={service.id}
              onClick={() => onSelectService(service.id)}
              className={[
                "cursor-pointer transition",
                isSelected ? "bg-blue-50" : "hover:bg-slate-50",
              ].join(" ")}
            >
              <td className="px-4 py-3 font-medium text-slate-900">
                {service.name}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {service.durationMin} min
              </td>

              <td className="px-4 py-3 text-slate-600">
                {service.price.toFixed(2)} €
              </td>

              <td className="px-4 py-3 text-slate-600">
                {service.employeeCount} empleados
              </td>

              <td className="px-4 py-3">
                {service.active ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                    Activo
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                    Inactivo
                  </span>
                )}
              </td>
            </tr>
          );
        })}

        {services.length === 0 && (
          <tr>
            <td
              colSpan={5}
              className="px-4 py-8 text-center text-sm text-slate-500"
            >
              No hay servicios todavía.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}