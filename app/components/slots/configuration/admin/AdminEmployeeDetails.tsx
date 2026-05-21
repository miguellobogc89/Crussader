// app/components/slots/configuration/Admin/AdminEmployeeDetails.tsx
"use client";

import {
  Briefcase,
  Mail,
  Save,
  Trash2,
  User2,
  Users,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import type { EmployeeItem } from "./admin.types";
import { EMPLOYEE_COLORS } from "./admin.types";

type AdminEmployeeDetailsProps = {
  employeeDraft: EmployeeItem | null;
  onEmployeeDraftChange: <K extends keyof EmployeeItem>(
    key: K,
    value: EmployeeItem[K],
  ) => void;
  showColorPicker: boolean;
  onToggleColorPicker: () => void;
  isSavingEmployee: boolean;
  onSaveEmployee: () => void;
  onInviteEmployee: () => void;
  onDeleteEmployee: () => void;
  saveEmployeeSuccess: string;
  inviteSuccess: string;
  deleteSuccess: string;
};

export function AdminEmployeeDetails({
  employeeDraft,
  onEmployeeDraftChange,
  showColorPicker,
  onToggleColorPicker,
  isSavingEmployee,
  onSaveEmployee,
  onInviteEmployee,
  onDeleteEmployee,
  saveEmployeeSuccess,
  inviteSuccess,
  deleteSuccess,
}: AdminEmployeeDetailsProps) {
  if (!employeeDraft) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
        <div className="flex min-h-[420px] items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
          Selecciona un empleado para editarlo.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Ficha del empleado
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Edita los datos relevantes del empleado.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {saveEmployeeSuccess ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {saveEmployeeSuccess}
              </span>
            ) : null}

            {inviteSuccess ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {inviteSuccess}
              </span>
            ) : null}

            {deleteSuccess ? (
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                {deleteSuccess}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Tratamiento
            </label>
            <Input
              value={employeeDraft.title ?? ""}
              onChange={(event) =>
                onEmployeeDraftChange("title", event.target.value)
              }
              placeholder="Dr / Dra"
              className="h-11 rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Nombre visible completo
            </label>
            <div className="relative">
              <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={employeeDraft.name}
                onChange={(event) =>
                  onEmployeeDraftChange("name", event.target.value)
                }
                className="h-11 rounded-xl border-slate-200 pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">Nombre</label>
            <Input
              value={employeeDraft.firstName ?? ""}
              onChange={(event) =>
                onEmployeeDraftChange("firstName", event.target.value)
              }
              className="h-11 rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Apellidos
            </label>
            <Input
              value={employeeDraft.lastName ?? ""}
              onChange={(event) =>
                onEmployeeDraftChange("lastName", event.target.value)
              }
              className="h-11 rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Rol / especialidad
            </label>
            <div className="relative">
              <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={employeeDraft.role}
                onChange={(event) =>
                  onEmployeeDraftChange("role", event.target.value)
                }
                className="h-11 rounded-xl border-slate-200 pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={employeeDraft.email ?? ""}
                onChange={(event) =>
                  onEmployeeDraftChange("email", event.target.value)
                }
                placeholder="ejemplo@empresa.com"
                className="h-11 rounded-xl border-slate-200 pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Teléfono
            </label>
            <Input
              value={employeeDraft.phone ?? ""}
              onChange={(event) =>
                onEmployeeDraftChange("phone", event.target.value)
              }
              placeholder="+34 ..."
              className="h-11 rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-slate-500">Estado</label>

            <button
              type="button"
              onClick={() =>
                onEmployeeDraftChange("active", !(employeeDraft.active ?? true))
              }
              className={`flex h-11 w-full items-center justify-between rounded-2xl border px-4 transition ${
                employeeDraft.active === false
                  ? "border-slate-200 bg-slate-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <span className="text-sm font-medium text-slate-900">
                {employeeDraft.active === false ? "Inactivo" : "Activo"}
              </span>

              <span
                className={`relative flex h-6 w-11 items-center rounded-full transition ${
                  employeeDraft.active === false
                    ? "bg-slate-300"
                    : "bg-emerald-500"
                }`}
              >
                <span
                  className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    employeeDraft.active === false ? "left-0.5" : "left-[22px]"
                  }`}
                />
              </span>
            </button>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-slate-500">Color</label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleColorPicker}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white"
              >
                <span
                  className="h-6 w-6 rounded-full border border-white shadow-sm"
                  style={{
                    backgroundColor: employeeDraft.color || "#0B6CF4",
                  }}
                />
              </button>

              <p className="text-xs text-slate-500">Pulsa para cambiar el color</p>
            </div>

            {showColorPicker ? (
              <div className="grid grid-cols-8 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                {EMPLOYEE_COLORS.map((color) => {
                  const isSelected = employeeDraft.color === color;

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onEmployeeDraftChange("color", color)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                        isSelected
                          ? "scale-110 border-slate-900"
                          : "border-slate-200 hover:scale-105"
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-slate-500">
              Estado de invitación
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Invitado
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {employeeDraft.invitedAt
                    ? new Date(employeeDraft.invitedAt).toLocaleString("es-ES")
                    : "Todavía no"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Unido al SaaS
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {employeeDraft.joinedAt
                    ? new Date(employeeDraft.joinedAt).toLocaleString("es-ES")
                    : "Pendiente"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-900">Acciones</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={onSaveEmployee}
              disabled={isSavingEmployee}
              className="h-10 rounded-xl"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSavingEmployee ? "Guardando..." : "Guardar cambios"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onInviteEmployee}
              className="h-10 rounded-xl border-[#0B6CF4]/20 text-[#0B6CF4] hover:bg-[#EFF6FF]"
            >
              Invitar al SaaS
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onDeleteEmployee}
            className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 transition hover:text-rose-700"
          >
            <Trash2 className="h-4 w-4" />
            Borrar empleado
          </button>
        </div>
      </div>
    </div>
  );
}