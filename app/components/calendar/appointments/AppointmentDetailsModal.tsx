// app/components/calendar/appointments/AppointmentDetailsModal.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import StandardModal from "@/app/components/crussader/StandardModal";
import type { CalendarAppt } from "@/app/components/calendar/calendar/types";
import { useActiveCompanyResolved } from "@/app/providers/bootstrap-store";

type ServiceLite = {
  id: string;
  name: string;
};

type EmployeeLite = {
  id: string;
  name: string;
  role: string;
  color: string;
  isPrimary: boolean;
};

type AppointmentStatusValue =
  | "PENDING"
  | "BOOKED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const STATUS_OPTIONS: {
  value: AppointmentStatusValue;
  label: string;
}[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "BOOKED", label: "Confirmada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "NO_SHOW", label: "No asistió" },
  { value: "CANCELLED", label: "Cancelada" },
];

type Props = {
  open: boolean;
  appointment: CalendarAppt | null;
  onClose: () => void;
  onCancelAppointment: () => void;
  onUpdated?: () => void;
};

function toDateInput(value: string) {
  return value.slice(0, 10);
}

function toTimeInput(value: string) {
  const date = new Date(value);
  return date.toTimeString().slice(0, 5);
}

export default function AppointmentDetailsModal({
  open,
  appointment,
  onClose,
  onCancelAppointment,
  onUpdated,
}: Props) {
  const activeCompany = useActiveCompanyResolved();
  const companyId = activeCompany?.id ?? "";

  const [services, setServices] = useState<ServiceLite[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState<AppointmentStatusValue>("BOOKED");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  const locationId = appointment?.locationId ?? "";

  const selectedService = useMemo(() => {
    return services.find((service) => service.id === serviceId) ?? null;
  }, [services, serviceId]);

  const selectedEmployee = useMemo(() => {
    return employees.find((employee) => employee.id === employeeId) ?? null;
  }, [employees, employeeId]);

  useEffect(() => {
    if (!open || !appointment) return;

    setServiceId(appointment.serviceId ?? "");
    setEmployeeId(appointment.employeeId ?? "");
    setStatus((appointment.status as AppointmentStatusValue) ?? "BOOKED");
    setDate(toDateInput(appointment.startAt));
    setTime(toTimeInput(appointment.startAt));
    setNotes(appointment.notes ?? "");
  }, [open, appointment]);

  useEffect(() => {
    if (!open || !locationId || !companyId) return;

    async function loadOptions() {
      try {
        const [servicesRes, employeesRes] = await Promise.all([
          fetch(
            `/api/service?companyId=${companyId}&employeeId=${encodeURIComponent(
              employeeId
            )}`
          ),
          fetch(
            `/api/employee?locationId=${locationId}&serviceId=${encodeURIComponent(
              serviceId
            )}`
          ),
        ]);

        const servicesJson = await servicesRes.json().catch(() => null);
        const employeesJson = await employeesRes.json().catch(() => null);

        setServices(Array.isArray(servicesJson?.items) ? servicesJson.items : []);
        setEmployees(Array.isArray(employeesJson?.items) ? employeesJson.items : []);
      } catch {
        setServices([]);
        setEmployees([]);
      }
    }

    loadOptions();
  }, [open, locationId, companyId, serviceId, employeeId]);

  async function handleUpdate() {
    if (!appointment || !date || !time) return;
    if (!serviceId && !employeeId) return;

    setLoading(true);

    try {
      const startAt = new Date(`${date}T${time}`);

      const res = await fetch(`/api/calendar/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startAt: startAt.toISOString(),
          serviceId: serviceId || null,
          employeeId: employeeId || null,
          notes: notes || null,
          status,
        }),
      });

      if (!res.ok) return;

      await onUpdated?.();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!appointment) return null;

  return (
    <StandardModal
      open={open}
      title="Detalle de cita"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onCancelAppointment}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cancelar cita
          </button>

          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] px-5 py-2 text-sm font-medium text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Estado">
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as AppointmentStatusValue)
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Servicio">
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          >
<option value="">Sin servicio concreto</option>

{appointment.serviceId && appointment.serviceName ? (
  services.some((service) => service.id === appointment.serviceId) ? null : (
    <option value={appointment.serviceId}>
      {appointment.serviceName}
    </option>
  )
) : null}

{services.map((service) => (
  <option key={service.id} value={service.id}>
    {service.name}
  </option>
))}
          </select>
        </Field>

        <Field label="Empleado">
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="">Sin asignar</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </Field>

          <Field label="Hora">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </Field>
        </div>

        <Field label="Cliente">
          <ReadOnlyLine
            title={appointment.customerName ?? "Sin cliente"}
            subtitle={
              [appointment.customerPhone, appointment.customerEmail]
                .filter(Boolean)
                .join(" · ") || "Sin contacto"
            }
          />
        </Field>

        <Field label="Notas">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            rows={3}
          />
        </Field>
      </div>
    </StandardModal>
  );
}

function ReadOnlyLine({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}