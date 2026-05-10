// app/components/calendar/appointments/AppointmentDetailsModal.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import StandardModal from "@/app/components/crussader/StandardModal";
import type { CalendarAppt } from "@/app/components/calendar/calendar/types";
import { useActiveCompanyResolved } from "@/app/providers/bootstrap-store";
import CustomerPicker, {
  type CustomerLite,
} from "@/app/components/calendar/appointments/CustomerPicker";

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
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [status, setStatus] = useState<AppointmentStatusValue>("BOOKED");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const locationId = appointment?.locationId ?? "";
const isGoogleAppointment =
  appointment?.source === "google" ||
  appointment?.externalProvider === "google-calendar" ||
  Boolean(appointment?.externalEventId) ||
  Boolean(appointment?.externalCalendarId);

  const selectedService = useMemo(() => {
    return services.find((service) => service.id === serviceId) ?? null;
  }, [services, serviceId]);

  const selectedEmployee = useMemo(() => {
    return employees.find((employee) => employee.id === employeeId) ?? null;
  }, [employees, employeeId]);

  useEffect(() => {
    if (!open || !appointment) {
      return;
    }

    setError("");
    setServiceId(appointment.serviceId ?? "");
    setEmployeeId(appointment.employeeId ?? "");
    setStatus((appointment.status as AppointmentStatusValue) ?? "BOOKED");
    setDate(toDateInput(appointment.startAt));
    setTime(toTimeInput(appointment.startAt));
    setNotes(appointment.notes ?? "");

    if (appointment.customerId) {
      setCustomer({
        id: appointment.customerId,
        displayName: appointment.customerName ?? "Cliente sin nombre",
        phone: appointment.customerPhone ?? null,
        email: appointment.customerEmail ?? null,
      });
    } else {
      setCustomer(null);
    }
  }, [open, appointment]);

  useEffect(() => {
    if (!open || !locationId || !companyId) {
      return;
    }

    async function loadOptions() {
      try {
        const servicesParams = new URLSearchParams();
        servicesParams.set("companyId", companyId);

        if (employeeId) {
          servicesParams.set("employeeId", employeeId);
        }

        const employeesParams = new URLSearchParams();
        employeesParams.set("locationId", locationId);

        if (serviceId) {
          employeesParams.set("serviceId", serviceId);
        }

        const [servicesRes, employeesRes] = await Promise.all([
          fetch(`/api/service?${servicesParams.toString()}`),
          fetch(`/api/employee?${employeesParams.toString()}`),
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

    void loadOptions();
  }, [open, locationId, companyId, serviceId, employeeId]);

  async function handleUpdate() {
    setError("");

    if (!appointment || !date || !time) {
      setError("Fecha y hora son obligatorias.");
      return;
    }

    if (!isGoogleAppointment && !serviceId && !employeeId) {
      setError("Selecciona al menos un servicio o un empleado.");
      return;
    }

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
          customerId: customer?.id ?? null,
          customerName: customer?.displayName ?? null,
          customerPhone: customer?.phone ?? null,
          customerEmail: customer?.email ?? null,
          notes: notes || null,
          status,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setError(json?.error || "No se pudo guardar la cita.");
        return;
      }

      await onUpdated?.();
      onClose();
    } catch {
      setError("Error inesperado guardando la cita.");
    } finally {
      setLoading(false);
    }
  }

  if (!appointment) {
    return null;
  }

  return (
    <StandardModal
      open={open}
      title={
        <div className="flex items-center gap-2">
          <span>Detalle de cita</span>

          {isGoogleAppointment ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 xl:text-[11px]">
              Google Calendar
            </span>
          ) : null}
        </div>
      }
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cerrar
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
<div className="space-y-3">

  {error ? (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700 xl:text-[13px]">
      {error}
    </div>
  ) : null}

  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
    <Field label="Estado">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as AppointmentStatusValue)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] xl:text-sm"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>

    <Field label="Cliente">
      <CustomerPicker
        companyId={companyId}
        value={customer}
        onChange={setCustomer}
      />
    </Field>

    <Field label="Servicio">
      <select
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] xl:text-sm"
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
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] xl:text-sm"
      >
        <option value="">Sin asignar</option>

        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
      </select>
    </Field>

    <Field label="Fecha">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] xl:text-sm"
      />
    </Field>

    <Field label="Hora">
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] xl:text-sm"
      />
    </Field>
  </div>

  <Field label="Notas">
    <textarea
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] xl:text-sm"
      rows={1}
    />
  </Field>

  <div className="flex justify-center pt-1">
    <button
      type="button"
      onClick={onCancelAppointment}
      className="rounded-xl border border-red-200 px-4 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50 xl:text-[13px]"
    >
      Cancelar cita
    </button>
  </div>
</div>
    </StandardModal>
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
      <label className="text-[12px] font-medium text-slate-700 xl:text-[13px]">{label}</label>
      {children}
    </div>
  );
}