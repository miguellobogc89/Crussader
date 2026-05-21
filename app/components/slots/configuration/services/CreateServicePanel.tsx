// app/components/slots/configuration/services/CreateServicePanel.tsx
"use client";

import { useState } from "react";
import { Loader2, Plus, Scissors, X } from "lucide-react";

type CreateServicePanelProps = {
  locationId: string;
  onCreateService: (input: {
    name: string;
    price: number;
    durationMin: number;
  }) => Promise<void>;
};

function normalizePrice(value: string): number | null {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function normalizeDuration(value: string): number | null {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
}

export function CreateServicePanel({
  locationId,
  onCreateService,
}: CreateServicePanelProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  function resetForm() {
    setName("");
    setPrice("");
    setDurationMin("");
    setErrorText("");
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  async function handleCreate() {
    setErrorText("");

    if (!locationId) {
      setErrorText("Selecciona una ubicación.");
      return;
    }

    const normalizedName = name.trim();
    const normalizedPrice = normalizePrice(price);
    const normalizedDuration = normalizeDuration(durationMin);

    if (!normalizedName) {
      setErrorText("Introduce el nombre del servicio.");
      return;
    }

    if (normalizedPrice === null) {
      setErrorText("Introduce un precio válido.");
      return;
    }

    if (normalizedDuration === null) {
      setErrorText("Introduce una duración válida.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateService({
        name: normalizedName,
        price: normalizedPrice,
        durationMin: normalizedDuration,
      });

      handleClose();
      setIsSubmitting(false);
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "No se pudo crear el servicio.",
      );
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 max-w-[160px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
      >
        <Plus className="h-4 w-4 shrink-0" />
        <span className="truncate">Añadir servicio</span>
      </button>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <Scissors className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Nuevo servicio
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Crea un servicio para la ubicación activa.
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
            placeholder="Ej. Limpieza dental"
            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-300"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Precio
          </label>
          <input
            value={price}
            onChange={(event) =>
              setPrice(event.target.value.replace(/[^0-9,.]/g, ""))
            }
            placeholder="Ej. 49,90"
            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-300"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Duración
          </label>
          <input
            value={durationMin}
            onChange={(event) =>
              setDurationMin(event.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder="Ej. 45"
            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-300"
          />
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
            Crear servicio
          </button>
        </div>
      </div>
    </div>
  );
}