"use client";

import { Search, Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import type { EmployeeItem, NewEmployeeForm } from "./admin.types";
import { EMPLOYEE_COLORS } from "./admin.types";

type AdminEmployeesListProps = {
  employees: EmployeeItem[];
  selectedEmployeeId: string;
  employeeSearch: string;
  onEmployeeSearchChange: (value: string) => void;
  onSelectEmployee: (employeeId: string) => void;
  loadingEmployees: boolean;
  employeesError: string;
  isCreatingEmployee: boolean;
  onToggleCreateEmployee: () => void;
  newEmployeeForm: NewEmployeeForm;
  onNewEmployeeFormChange: (field: keyof NewEmployeeForm, value: string) => void;
  showCreateColorPicker: boolean;
  onToggleCreateColorPicker: () => void;
  createEmployeeError: string;
  createEmployeeSuccess: string;
  isSubmittingCreate: boolean;
  onCreateEmployee: () => void;
  onCancelCreateEmployee: () => void;
};

export function AdminEmployeesList({
  employees,
  selectedEmployeeId,
  employeeSearch,
  onEmployeeSearchChange,
  onSelectEmployee,
  loadingEmployees,
  employeesError,
  isCreatingEmployee,
  onToggleCreateEmployee,
  newEmployeeForm,
  onNewEmployeeFormChange,
  showCreateColorPicker,
  onToggleCreateColorPicker,
  createEmployeeError,
  createEmployeeSuccess,
  isSubmittingCreate,
  onCreateEmployee,
  onCancelCreateEmployee,
}: AdminEmployeesListProps) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Empleados</p>
          <p className="text-xs text-slate-500">
            Lista de empleados visibles en esta ubicación
          </p>
        </div>

        <Button
          type="button"
          onClick={onToggleCreateEmployee}
          className="h-9 rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={employeeSearch}
          onChange={(event) => onEmployeeSearchChange(event.target.value)}
          placeholder="Buscar empleado..."
          className="h-10 rounded-xl border-slate-200 bg-white pl-9"
        />
      </div>

      {isCreatingEmployee ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3">
          <div className="grid gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                value={newEmployeeForm.title}
                onChange={(event) =>
                  onNewEmployeeFormChange("title", event.target.value)
                }
                placeholder="Dr / Dra"
                className="h-10 rounded-xl border-slate-200"
              />

              <Input
                value={newEmployeeForm.firstName}
                onChange={(event) =>
                  onNewEmployeeFormChange("firstName", event.target.value)
                }
                placeholder="Nombre"
                className="h-10 rounded-xl border-slate-200"
              />

              <Input
                value={newEmployeeForm.lastName}
                onChange={(event) =>
                  onNewEmployeeFormChange("lastName", event.target.value)
                }
                placeholder="Apellidos"
                className="h-10 rounded-xl border-slate-200"
              />
            </div>

            <Input
              value={newEmployeeForm.name}
              onChange={(event) =>
                onNewEmployeeFormChange("name", event.target.value)
              }
              placeholder="Nombre visible completo"
              className="h-10 rounded-xl border-slate-200"
            />

            <Input
              value={newEmployeeForm.role}
              onChange={(event) =>
                onNewEmployeeFormChange("role", event.target.value)
              }
              placeholder="Especialidad / rol"
              className="h-10 rounded-xl border-slate-200"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                value={newEmployeeForm.email}
                onChange={(event) =>
                  onNewEmployeeFormChange("email", event.target.value)
                }
                placeholder="Email"
                className="h-10 rounded-xl border-slate-200"
              />

              <Input
                value={newEmployeeForm.phone}
                onChange={(event) =>
                  onNewEmployeeFormChange("phone", event.target.value)
                }
                placeholder="Teléfono"
                className="h-10 rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">Color</p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onToggleCreateColorPicker}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
                >
                  <span
                    className="h-5 w-5 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: newEmployeeForm.color }}
                  />
                </button>

                <p className="text-xs text-slate-500">
                  Selecciona un color para el empleado
                </p>
              </div>

              {showCreateColorPicker ? (
                <div className="grid grid-cols-8 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {EMPLOYEE_COLORS.map((color) => {
                    const isSelected = newEmployeeForm.color === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onNewEmployeeFormChange("color", color)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                          isSelected
                            ? "scale-110 border-slate-900"
                            : "border-slate-200 hover:scale-105"
                        }`}
                      >
                        <span
                          className="h-5 w-5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {createEmployeeError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {createEmployeeError}
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={onCreateEmployee}
                disabled={isSubmittingCreate}
                className="h-10 flex-1 rounded-xl"
              >
                {isSubmittingCreate ? "Creando..." : "Guardar empleado"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onCancelCreateEmployee}
                className="h-10 rounded-xl"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {createEmployeeSuccess ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {createEmployeeSuccess}
        </div>
      ) : null}

      <div className="space-y-2">
        {loadingEmployees ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
            Cargando empleados...
          </div>
        ) : null}

        {!loadingEmployees && employeesError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {employeesError}
          </div>
        ) : null}

        {!loadingEmployees && !employeesError && employees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
            No hay empleados para esta ubicación.
          </div>
        ) : null}

        {!loadingEmployees && !employeesError
          ? employees.map((employee) => {
              const isSelected = employee.id === selectedEmployeeId;

              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => onSelectEmployee(employee.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-[#0B6CF4] bg-[#EFF6FF]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {employee.name}
                        </p>

                        {employee.active === false ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            Inactivo
                          </span>
                        ) : null}
                      </div>

                      <p className="truncate text-xs text-slate-500">
                        {employee.role}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {employee.color ? (
                        <span
                          className="h-3 w-3 rounded-full border border-slate-200"
                          style={{ backgroundColor: employee.color }}
                        />
                      ) : null}

                      {employee.isPrimary ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                          Principal
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          : null}
      </div>
    </div>
  );
}