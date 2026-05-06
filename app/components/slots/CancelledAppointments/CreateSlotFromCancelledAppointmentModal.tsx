// app/components/slots/CancelledAppointments/CreateSlotFromCancelledAppointmentModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { CancelledAppointmentItem } from "./CancelledAppointmentsList";
import { EmployeeSelector } from "@/app/components/slots/NewAvailableSlotModal/EmployeeSelector";
import type { EmployeeLite } from "@/app/components/slots/NewAvailableSlotModal/NewCancellationModal.helpers";

type Props = {
  open: boolean;
  appointment: CancelledAppointmentItem | null;
  locationId: string;
  onClose: () => void;
  onCreated?: () => void;
};

export function CreateSlotFromCancelledAppointmentModal({
  open,
  appointment,
  locationId,
  onClose,
  onCreated,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  useEffect(() => {
    if (!open || !locationId) {
      return;
    }

    setIsSubmitting(false);
    setSelectedEmployeeId(appointment?.employeeId ?? "");

    let cancelled = false;

    async function loadEmployees() {
      try {
        const response = await fetch(
          `/api/slots/employees/list?locationId=${encodeURIComponent(locationId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (cancelled) {
          return;
        }

        const nextEmployees: EmployeeLite[] = Array.isArray(data?.employees)
          ? data.employees.map((item: any) => ({
              id: String(item.id),
              name: String(item.name),
              active: true,
            }))
          : [];

        setEmployees(nextEmployees);
      } catch (error) {
        console.error("[CreateSlotFromCancelledAppointmentModal] loadEmployees", error);

        if (!cancelled) {
          setEmployees([]);
        }
      }
    }

    void loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [open, locationId, appointment]);

  async function handleCreate() {
    if (!appointment || !selectedEmployeeId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/slots/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedLocationId: locationId,
          employeeId: selectedEmployeeId,
          startsAt: appointment.startAt,
          endsAt: appointment.endAt,
          serviceName: appointment.serviceName ?? null,
          notes: undefined,
          selectedServiceIds: [],
          sourceAppointmentId: appointment.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        console.error("[CreateSlotFromCancelledAppointmentModal]", data);
        setIsSubmitting(false);
        return;
      }

      onCreated?.();
      onClose();
      setIsSubmitting(false);
    } catch (error) {
      console.error("[CreateSlotFromCancelledAppointmentModal]", error);
      setIsSubmitting(false);
    }
  }

  if (!open || !appointment) {
    return null;
  }

  const hasEmployee = Boolean(appointment.employeeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              ¿Crear hueco disponible?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Se creará un hueco a partir de esta cita cancelada.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
          <div className="font-semibold text-slate-900">
            {appointment.employeeName ?? "Empleado no identificado"}
          </div>

          <div className="mt-1 text-slate-600">
            {formatDate(appointment.startAt)}
          </div>

          <div className="mt-1 text-slate-600">
            {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
          </div>

          {appointment.serviceName ? (
            <div className="mt-2 text-xs text-slate-500">
              {appointment.serviceName}
            </div>
          ) : null}
        </div>

        {!hasEmployee ? (
          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Selecciona especialista
            </div>

            <EmployeeSelector
              employees={employees}
              selectedEmployeeId={selectedEmployeeId}
              onSelect={(employee) => {
                setSelectedEmployeeId(employee.id);
              }}
            />
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={!selectedEmployeeId || isSubmitting}
            onClick={handleCreate}
            className="bg-[#0B6CF4] text-white hover:bg-[#0a5ed8]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear hueco"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}