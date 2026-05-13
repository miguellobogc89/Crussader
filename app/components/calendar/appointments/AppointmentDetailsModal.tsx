// app/components/calendar/appointments/AppointmentDetailsModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  Search,
  X,
} from "lucide-react";
import StandardModal from "@/app/components/crussader/StandardModal";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import type { CalendarAppt } from "@/app/components/calendar/calendar/types";
import { useActiveCompanyResolved } from "@/app/providers/bootstrap-store";
import { toast } from "@/app/components/ui/use-toast";
import { cn } from "@/lib/utils";
import CustomerPicker, {
  type CustomerLite,
} from "@/app/components/calendar/appointments/CustomerPicker";

type ServiceLite = {
  id: string;
  name: string;
  durationMin?: number;
  price?: number;
  active?: boolean;
};

type EmployeeLite = {
  id: string;
  name: string;
  role?: string;
  color?: string;
  isPrimary?: boolean;
};

type EmployeeServiceItem = ServiceLite & {
  employeeId: string;
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

const FIELD_LABEL_CLASS =
  "text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500";

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100";

const TEXTAREA_CLASS =
  "min-h-[92px] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100";

const PICKER_BUTTON_CLASS =
  "flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-sm shadow-sm transition hover:bg-slate-50";

type Props = {
  open: boolean;
  appointment: CalendarAppt | null;
  onClose: () => void;
  onCancelAppointment: () => void;
  onUpdated?: () => void;
};

export default function AppointmentDetailsModal({
  open,
  appointment,
  onClose,
  onCancelAppointment,
  onUpdated,
}: Props) {
  const activeCompany = useActiveCompanyResolved();
  const companyId = activeCompany?.id ?? "";
  const locationId = appointment?.locationId ?? "";
  const appointmentId = appointment?.id ?? "";

  const [services, setServices] = useState<ServiceLite[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [employeeServices, setEmployeeServices] = useState<EmployeeServiceItem[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [status, setStatus] = useState<AppointmentStatusValue>("BOOKED");
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const serviceDropdownRef = useRef<HTMLDivElement | null>(null);

  const isGoogleAppointment =
    appointment?.source === "google" ||
    appointment?.externalProvider === "google-calendar" ||
    Boolean(appointment?.externalEventId) ||
    Boolean(appointment?.externalCalendarId);

  const selectedService = useMemo(() => {
    return services.find((service) => service.id === serviceId) ?? null;
  }, [services, serviceId]);

  const compatibleEmployees = useMemo(() => {
    if (!serviceId) {
      return employees;
    }

    const compatibleEmployeeIds = new Set(
      employeeServices
        .filter((item) => item.id === serviceId)
        .map((item) => item.employeeId)
    );

    return employees.filter((employee) => {
      return compatibleEmployeeIds.has(employee.id);
    });
  }, [employees, employeeServices, serviceId]);

  const filteredServices = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();

    if (!query) {
      return services;
    }

    return services.filter((service) => {
      return service.name.toLowerCase().includes(query);
    });
  }, [services, serviceSearch]);

  const advisoryText = useMemo(() => {
    if (isUrgent && !employeeId) {
      return "Para una urgencia es recomendable asignar al menos un profesional.";
    }

    if (!serviceId && !employeeId) {
      return "Es recomendable asignar un servicio o un profesional para que la cita quede bien clasificada.";
    }

    return "";
  }, [isUrgent, serviceId, employeeId]);

  useEffect(() => {
    if (!open || !appointment) {
      return;
    }

    setErrorText("");
    setLoading(false);
    setServiceDropdownOpen(false);
    setServiceSearch("");
    setIsUrgent(Boolean(appointment.isUrgent));
    setOptionsLoaded(false);

    setServiceId(appointment.serviceId ?? "");
    setEmployeeId(appointment.employeeId ?? "");
    setStatus(normalizeStatus(appointment.status));
    setDateValue(getDateValueFromISO(appointment.startAt));
    setTimeValue(getTimeValueFromISO(appointment.startAt));
    setNotes(appointment.notes ?? "");

    if (appointment.customerId) {
      setCustomer({
        id: appointment.customerId,
        displayName: appointment.customerName ?? "Cliente sin nombre",
        phone: appointment.customerPhone ?? null,
        email: appointment.customerEmail ?? null,
      });
      return;
    }

    setCustomer(null);
  }, [open, appointmentId]);

  useEffect(() => {
    if (!open || !locationId || !companyId) {
      setServices([]);
      setEmployees([]);
      setEmployeeServices([]);
      return;
    }

    let cancelled = false;

    async function loadOptions() {
      try {
        const servicesParams = new URLSearchParams();
        servicesParams.set("companyId", companyId);

        const employeesParams = new URLSearchParams();
        employeesParams.set("locationId", locationId);

        const employeeServicesParams = new URLSearchParams();
        employeeServicesParams.set("locationId", locationId);

        const [servicesRes, employeesRes, employeeServicesRes] = await Promise.all([
          fetch(`/api/service?${servicesParams.toString()}`, {
            method: "GET",
            cache: "no-store",
          }),
          fetch(`/api/employee?${employeesParams.toString()}`, {
            method: "GET",
            cache: "no-store",
          }),
          fetch(
            `/api/slots/employees/services/list?${employeeServicesParams.toString()}`,
            {
              method: "GET",
              cache: "no-store",
            }
          ),
        ]);

        const servicesJson = await servicesRes.json().catch(() => null);
        const employeesJson = await employeesRes.json().catch(() => null);
        const employeeServicesJson = await employeeServicesRes
          .json()
          .catch(() => null);

        if (cancelled) {
          return;
        }

        const nextServices: ServiceLite[] = Array.isArray(servicesJson?.items)
          ? servicesJson.items.map((item: any) => {
              return {
                id: String(item.id),
                name: String(item.name ?? "Servicio"),
                durationMin: Number(item.durationMin ?? item.duration_min ?? 0),
                price: Number(item.price ?? item.price_cents ?? 0),
                active: item.active ?? true,
              };
            })
          : [];

        const nextEmployees: EmployeeLite[] = Array.isArray(employeesJson?.items)
          ? employeesJson.items.map((item: any) => {
              return {
                id: String(item.id),
                name: String(item.name ?? item.fullName ?? "Empleado"),
                role: item.role ?? "",
                color: item.color ?? "#94A3B8",
                isPrimary: Boolean(item.isPrimary),
              };
            })
          : [];

        const nextEmployeeServices: EmployeeServiceItem[] = Array.isArray(
          employeeServicesJson?.services
        )
          ? employeeServicesJson.services.map((item: any) => {
              return {
                id: String(item.id),
                name: String(item.name ?? "Servicio"),
                employeeId: String(item.employeeId),
                durationMin: Number(item.durationMin ?? 0),
                price: Number(item.price ?? 0),
                active: item.active ?? true,
              };
            })
          : [];

        setServices(nextServices);
        setEmployees(nextEmployees);
        setEmployeeServices(nextEmployeeServices);
        setOptionsLoaded(true);
      } catch (error) {
        console.error("[AppointmentDetailsModal] loadOptions", error);

        if (!cancelled) {
          setServices([]);
          setEmployees([]);
          setEmployeeServices([]);
          setOptionsLoaded(true);
        }
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [open, locationId, companyId]);

useEffect(() => {
  if (!optionsLoaded || !serviceId || !employeeId) {
    return;
  }

  const isStillCompatible = compatibleEmployees.some((employee) => {
    return employee.id === employeeId;
  });

  if (!isStillCompatible) {
    setEmployeeId("");
  }
}, [optionsLoaded, serviceId, employeeId, compatibleEmployees]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!serviceDropdownRef.current) {
        return;
      }

      if (serviceDropdownRef.current.contains(event.target as Node)) {
        return;
      }

      setServiceDropdownOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  async function handleUpdate() {
    setErrorText("");

    if (!appointment || !dateValue || !timeValue) {
      setErrorText("Fecha y hora son obligatorias.");
      return;
    }

    if (isUrgent && !employeeId) {
      setErrorText("Para marcar una cita como urgente, asigna un profesional.");
      return;
    }

    const startAt = buildIsoFromLocal(dateValue, timeValue);

    if (!startAt) {
      setErrorText("Fecha u hora no válidas.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/calendar/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startAt,
          serviceId: serviceId || null,
          employeeId: employeeId || null,
          customerId: customer?.id ?? null,
          customerName: customer?.displayName ?? null,
          customerPhone: customer?.phone ?? null,
          customerEmail: customer?.email ?? null,
          notes: notes || null,
          status,
          isUrgent,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const message = json?.error || "No se pudo guardar la cita.";
        setErrorText(message);

        toast({
          variant: "error",
          title: "No se pudo guardar",
          description: message,
        });

        setLoading(false);
        return;
      }

      toast({
        variant: "success",
        title: "Cita actualizada",
        description: "Los cambios de la cita se han guardado correctamente.",
      });

      await onUpdated?.();
      setLoading(false);
      onClose();
    } catch (error) {
      console.error("[AppointmentDetailsModal] handleUpdate", error);

      const message = "Error inesperado guardando la cita.";
      setErrorText(message);

      toast({
        variant: "error",
        title: "No se pudo guardar",
        description: message,
      });

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
          <span>Editar cita</span>

          {isGoogleAppointment ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 xl:text-[11px]">
              Google Calendar
            </span>
          ) : null}
        </div>
      }
      onClose={onClose}
footer={
  <div className="flex w-full items-center justify-between gap-3">
    <Button
      type="button"
      variant="outline"
      onClick={onClose}
      disabled={loading}
      className="h-10 rounded-xl"
    >
      Cerrar
    </Button>

    <button
      type="button"
      onClick={onCancelAppointment}
      disabled={loading}
      className="h-10 rounded-xl border border-red-200 px-4 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
    >
      Cancelar cita
    </button>

    <Button
      type="button"
      onClick={handleUpdate}
      disabled={loading}
      className="h-10 gap-2 rounded-xl bg-crussader px-5 font-semibold text-white hover:bg-crussader/90 disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando
        </>
      ) : (
        "Guardar cambios"
      )}
    </Button>
  </div>
}
    >
      {!optionsLoaded ? (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    ) : (
      <div className="space-y-3 px-4 pb-3 pt-0">
        {errorText ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorText}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Fecha">
<Input
  type="date"
  value={dateValue}
  onChange={(event) => setDateValue(event.target.value)}
  className={INPUT_CLASS}
/>
          </Field>

          <Field label="Hora">
<Input
  type="time"
  step={300}
  value={timeValue}
  onChange={(event) => setTimeValue(event.target.value)}
  className={`${INPUT_CLASS} tabular-nums`}
/>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Cliente">
            <CustomerPicker
              companyId={companyId}
              value={customer}
              onChange={setCustomer}
            />
          </Field>

          <Field label="Estado">
<select
  value={status}
  onChange={(event) => {
    setStatus(event.target.value as AppointmentStatusValue);
  }}
  className={cn(
    INPUT_CLASS,
    status === "CANCELLED" &&
      "border-rose-200 bg-rose-50 text-rose-700 focus:border-rose-300 focus:ring-rose-100"
  )}
>
              {STATUS_OPTIONS.map((option) => {
                return (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                );
              })}
            </select>
          </Field>
        </div>

        <Field label="Servicio">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div ref={serviceDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setServiceDropdownOpen(true);
                }}
                className={PICKER_BUTTON_CLASS}
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-800">
                    {selectedService?.name ??
                      appointment.serviceName ??
                      "Seleccionar servicio"}
                  </div>

                  {selectedService?.durationMin ? (
                    <div className="text-xs text-slate-500">
                      {selectedService.durationMin} min
                    </div>
                  ) : null}
                </div>

                <div className="ml-3 flex shrink-0 items-center gap-2">
                  {serviceId ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setServiceId("");
                        setServiceSearch("");
                      }}
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </span>
                  ) : null}

                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
              </button>

              {serviceDropdownOpen ? (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      autoFocus
                      value={serviceSearch}
                      onChange={(event) => setServiceSearch(event.target.value)}
                      placeholder="Buscar servicio..."
                      className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto p-2">
                    {filteredServices.map((service) => {
                      const isSelected = service.id === serviceId;

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => {
                            setServiceId(service.id);
                            setServiceSearch("");
                            setServiceDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                            isSelected
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold">
                              {service.name}
                            </div>

                            {service.durationMin ? (
                              <div className="text-xs text-slate-500">
                                {service.durationMin} min
                              </div>
                            ) : null}
                          </div>

                          {isSelected ? <Check className="h-4 w-4" /> : null}
                        </button>
                      );
                    })}

                    {filteredServices.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-slate-500">
                        No hay servicios que coincidan.
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setIsUrgent((prev) => !prev)}
              className={cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold transition",
  isUrgent
    ? "border-orange-300 bg-orange-50 text-orange-700 shadow-sm"
    : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
)}
            >
              <AlertTriangle className="h-4 w-4" />
              Urgencia
            </button>
          </div>
        </Field>

        <Field label={serviceId ? "Profesionales compatibles" : "Profesional recomendado"}>
          <div className="flex flex-wrap gap-2">
            {compatibleEmployees.map((employee) => {
              const isSelected = employee.id === employeeId;

              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => {
                    setEmployeeId(isSelected ? "" : employee.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    isSelected
                      ? "border-[#0B6CF4] bg-[#0B6CF4] text-white shadow-[0_2px_8px_rgba(11,108,244,0.25)]"
                      : "border-border bg-white text-slate-700 hover:bg-muted/40"
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: employee.color || "#94A3B8" }}
                  />

                  <span>{employee.name}</span>

                  {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
              );
            })}

            {compatibleEmployees.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                No hay profesionales disponibles para este servicio.
              </div>
            ) : null}
          </div>
        </Field>

        {advisoryText ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{advisoryText}</span>
          </div>
        ) : null}

        <Field label="Notas">
<textarea
  value={notes}
  onChange={(event) => setNotes(event.target.value)}
  placeholder="Añadir notas adicionales..."
  className={TEXTAREA_CLASS}
  rows={3}
/>
        </Field>
      </div>
      )}
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
    <div className="space-y-1.5">
      <Label className={FIELD_LABEL_CLASS}>{label}</Label>
      {children}
    </div>
  );
}

function normalizeStatus(value: unknown): AppointmentStatusValue {
  if (
    value === "PENDING" ||
    value === "BOOKED" ||
    value === "COMPLETED" ||
    value === "CANCELLED" ||
    value === "NO_SHOW"
  ) {
    return value;
  }

  return "BOOKED";
}

function getDateValueFromISO(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-CA");
}

function getTimeValueFromISO(value: string): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function buildIsoFromLocal(dateValue: string, timeValue: string): string | null {
  if (!dateValue || !timeValue) {
    return null;
  }

  const date = new Date(`${dateValue}T${timeValue}:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}