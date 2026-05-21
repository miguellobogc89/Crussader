// app/components/slots/configuration/employees/CreateEmployeePanel.tsx
"use client";

import { useState } from "react";
import { Loader2, Plus, UserPlus, X } from "lucide-react";

type CreateEmployeePanelProps = {
  locationId: string;
  onCreateEmployee: (input: {
    name: string;
    jobTitle: string;
    color: string;
  }) => Promise<void>;
};

const COLOR_OPTIONS = [
  "#2563eb",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
];

function normalizeText(value: string): string {
  return value.trim();
}

export function CreateEmployeePanel({
  locationId,
  onCreateEmployee,
}: CreateEmployeePanelProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  function resetForm() {
    setName("");
    setJobTitle("");
    setColor(COLOR_OPTIONS[0]);
    setErrorText("");
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  async function handleCreate() {
    setErrorText("");

    const normalizedName = normalizeText(name);
    const normalizedJobTitle = normalizeText(jobTitle);

    if (!locationId) {
      setErrorText("Selecciona una ubicación.");
      return;
    }

    if (!normalizedName) {
      setErrorText("Introduce el nombre del empleado.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateEmployee({
        name: normalizedName,
        jobTitle: normalizedJobTitle,
        color,
      });

      handleClose();
      setIsSubmitting(false);
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "No se pudo crear el empleado.",
      );
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 max-w-[170px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
      >
        <Plus className="h-4 w-4 shrink-0" />
        <span className="truncate">Añadir empleado</span>
      </button>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <UserPlus className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Nuevo empleado
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Crea un empleado y asígnalo a esta ubicación.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Nombre
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Lucía Romero"
            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-300"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Especialidad / cargo
          </label>
          <input
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            placeholder="Ej. Odontología general"
            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-300"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-600">
            Color
          </label>

          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((option) => {
              const isActive = color === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border transition"
                  style={{
                    backgroundColor: option,
                    borderColor: isActive ? "#0f172a" : "transparent",
                  }}
                >
                  <span className="sr-only">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorText ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorText}
          </div>
        ) : null}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Crear empleado
          </button>
        </div>
      </div>
    </div>
  );
}