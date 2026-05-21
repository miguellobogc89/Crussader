// app/components/slots/configuration/employees/EmployeesPanel.tsx
"use client";

import { Search, Users2 } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import type { EmployeeItem } from "./EmployeesShell";

type EmployeesPanelProps = {
  employees: EmployeeItem[];
  selectedEmployeeId: string;
  employeeQuery: string;
  onSelectEmployee: (employeeId: string) => void;
  onEmployeeQueryChange: (value: string) => void;
  loading?: boolean;
  errorText?: string;
  actionSlot?: React.ReactNode;
};

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

export function EmployeesPanel({
  employees,
  selectedEmployeeId,
  employeeQuery,
  onSelectEmployee,
  onEmployeeQueryChange,
  loading = false,
  errorText = "",
  actionSlot,
}: EmployeesPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <Users2 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Empleados</p>
          <p className="text-xs text-slate-500">Selecciona uno para editar</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={employeeQuery}
            onChange={(event) => onEmployeeQueryChange(event.target.value)}
            placeholder="Buscar empleado..."
            className="h-10 w-full rounded-2xl border-slate-200 bg-white pl-9"
          />
        </div>

        <div className="shrink-0">{actionSlot}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Cargando empleados...
          </div>
        ) : null}

        {!loading && errorText ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorText}
          </div>
        ) : null}

        {!loading && !errorText ? (
          <div className="space-y-2">
            {employees.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                No hay empleados en esta ubicación.
              </div>
            ) : null}

            {employees.map((employee) => {
              const isSelected = employee.id === selectedEmployeeId;

              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => onSelectEmployee(employee.id)}
                  className={[
                    "w-full rounded-2xl border p-3 text-left transition",
                    isSelected
                      ? "border-sky-300 bg-white shadow-[0_8px_24px_rgba(14,165,233,0.10)]"
                      : "border-transparent bg-white/70 hover:border-slate-200 hover:bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    {employee.colorClass ? (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-semibold text-white"
                        style={{ backgroundColor: employee.colorClass }}
                      >
                        {getInitials(employee.name)}
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-700">
                        {getInitials(employee.name)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {employee.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {employee.role}
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