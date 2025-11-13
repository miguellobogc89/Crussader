"use client";

import * as React from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/lib/utils";

type EmployeeRole = {
  isPrimary: boolean;
  role: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    active: boolean;
  };
};

type EmployeeRow = {
  id: string;
  name: string;
  active: boolean;
  roles: EmployeeRole[];
  primaryRoleName: string | null;
  primaryRoleColor: string | null;
};

type Props = {
  /** Empleado seleccionado (o null si ninguno) */
  selectedEmployeeId?: string | null;
  /** Callback cuando se selecciona / deselecciona un empleado */
  onSelect?: (id: string | null) => void;
};

export function ShiftEmployeesPanel({
  selectedEmployeeId,
  onSelect,
}: Props) {
  const [employees, setEmployees] = React.useState<EmployeeRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/mybusiness/employees", {
          credentials: "include",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!cancelled) {
          setEmployees(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err: any) {
        console.error("Error cargando empleados:", err);
        if (!cancelled) {
          setError(err?.message ?? "Error al cargar empleados");
          setEmployees([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Agrupamos por rol principal (para el “cluster” de cocina / sala / etc)
  const grouped = React.useMemo(() => {
    const groups: Record<string, EmployeeRow[]> = {};

    for (const emp of employees) {
      const key = emp.primaryRoleName || "Sin rol";
      if (!groups[key]) groups[key] = [];
      groups[key].push(emp);
    }

    // Orden simple: “Sin rol” al final
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === "Sin rol") return 1;
      if (b[0] === "Sin rol") return -1;
      return a[0].localeCompare(b[0], "es");
    });
  }, [employees]);

  return (
    <Card className="h-full min-h-[260px] flex flex-col border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Equipo
          </div>
          <div className="text-sm font-medium text-slate-800">
            Empleados
          </div>
          <div className="text-[11px] text-slate-500">
            Haz clic para ver y editar sus turnos semanales.
          </div>
        </div>
        {employees.length > 0 && (
          <div className="text-xs text-slate-400">
            {employees.length} empleados
          </div>
        )}
      </div>

      {/* Estados de carga / error */}
      {error && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">
          {error}
        </div>
      )}

      {loading && (
        <div className="px-4 py-3 text-xs text-slate-500 bg-slate-50 border-b border-slate-100">
          Cargando empleados…
        </div>
      )}

      {/* Lista agrupada por rol */}
      <div className="flex-1 overflow-auto px-3 py-3 space-y-4">
        {!loading && employees.length === 0 && !error && (
          <p className="text-xs text-slate-500 px-1">
            No hay empleados todavía. Crea empleados desde la sección de
            calendario de reservas.
          </p>
        )}

        {grouped.map(([roleName, items]) => (
          <div key={roleName} className="space-y-1.5">
            {/* Cabecera de grupo (rol) */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {roleName}
                </span>
                <span className="text-[11px] text-slate-400">
                  · {items.length}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {items.map((emp) => {
                const isSelected = emp.id === selectedEmployeeId;
                const primaryColor = emp.primaryRoleColor || "#0ea5e9";

                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() =>
                      onSelect?.(
                        isSelected ? null : emp.id
                      )
                    }
                    className={cn(
                      "w-full text-left rounded-lg border px-3 py-2.5 text-sm flex items-center justify-between gap-2 transition-all",
                      "bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/60",
                      isSelected &&
                        "border-sky-500 bg-sky-50 shadow-sm"
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-slate-800 truncate">
                        {emp.name}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {emp.primaryRoleName && (
                          <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                            {emp.primaryRoleName}
                          </span>
                        )}
                        {!emp.active && (
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50 text-[10px] text-amber-700 px-1 py-0 h-4"
                          >
                            Inactivo
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Bolita de color según rol principal */}
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
