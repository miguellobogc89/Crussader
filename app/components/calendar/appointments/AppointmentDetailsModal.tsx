// app/components/calendar/appointments/AppointmentDetailsModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import StandardModal from "@/app/components/crussader/StandardModal";
import { Button } from "@/app/components/ui/button";
import type { CalendarAppt } from "@/app/components/calendar/calendar/types";
import { useActiveCompanyResolved } from "@/app/providers/bootstrap-store";
import { toast } from "@/app/components/ui/use-toast";
import { cn } from "@/lib/utils";
import CustomerPicker, {
  type CustomerLite,
} from "@/app/components/calendar/appointments/CustomerPicker";
import {
  ModalFormField,
  ModalTextarea,
  SearchablePicker,
  MODAL_INPUT_CLASS,
} from "@/app/components/crussader/UX/inputs";
import { DatePicker } from "@/app/components/crussader/UX/inputs/DatePicker";
import { TimeSelector } from "@/app/components/crussader/UX/inputs/TimeSelector";
import {
  buildAppointmentOptionsParams,
  buildIsoFromLocal,
  buildServicePickerItems,
  getAvailableServicePickerItems,
  getCompatibleEmployees,
  getDateValueFromISO,
  getSelectedService,
  getTimeValueFromISO,
  isServiceAvailableForEmployee,
  mapEmployeeServicesResponse,
  mapEmployeesResponse,
  mapServicesResponse,
  normalizeStatus,
  STATUS_OPTIONS,
  type AppointmentStatusValue,
  type EmployeeLite,
  type EmployeeServiceItem,
  type ServiceLite,
} from "./AppointmentModal.helpers";

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

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const isGoogleAppointment =
    appointment?.source === "google" ||
    appointment?.externalProvider === "google-calendar" ||
    Boolean(appointment?.externalEventId) ||
    Boolean(appointment?.externalCalendarId);

  const selectedService = useMemo(() => {
    return getSelectedService(services, serviceId);
  }, [services, serviceId]);

  const servicePickerItems = useMemo(() => {
    return buildServicePickerItems(services);
  }, [services]);

  const availableServicePickerItems = useMemo(() => {
    return getAvailableServicePickerItems({
      servicePickerItems,
      employeeServices,
      employeeId,
    });
  }, [employeeId, employeeServices, servicePickerItems]);

  const compatibleEmployees = useMemo(() => {
    return getCompatibleEmployees({ employees, employeeServices, serviceId });
  }, [employees, employeeServices, serviceId]);

  const advisoryText = useMemo(() => {
    if (isUrgent && !employeeId) {
      return "Para una urgencia es recomendable asignar al menos un profesional.";
    }

    if (!serviceId && !employeeId) {
      return "Es recomendable asignar un servicio o un profesional para que la cita quede bien clasificada.";
    }

    return "";
  }, [employeeId, isUrgent, serviceId]);

  useEffect(() => {
    if (!open || !appointment) {
      return;
    }

    setErrorText("");
    setLoading(false);
    setOptionsLoaded(false);
    setIsUrgent(Boolean(appointment.isUrgent));
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
  }, [appointment, appointmentId, open]);

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
        const { servicesUrl, employeesUrl, employeeServicesUrl } =
          buildAppointmentOptionsParams({ companyId, locationId });

        const [servicesRes, employeesRes, employeeServicesRes] = await Promise.all([
          fetch(servicesUrl, { method: "GET", cache: "no-store" }),
          fetch(employeesUrl, { method: "GET", cache: "no-store" }),
          fetch(employeeServicesUrl, { method: "GET", cache: "no-store" }),
        ]);

        const servicesJson = await servicesRes.json().catch(() => null);
        const employeesJson = await employeesRes.json().catch(() => null);
        const employeeServicesJson = await employeeServicesRes
          .json()
          .catch(() => null);

        if (cancelled) {
          return;
        }

        setServices(mapServicesResponse(servicesJson));
        setEmployees(mapEmployeesResponse(employeesJson));
        setEmployeeServices(mapEmployeeServicesResponse(employeeServicesJson));
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
  }, [companyId, locationId, open]);

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
        headers: { "Content-Type": "application/json" },
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
        toast({ variant: "error", title: "No se pudo guardar", description: message });
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
      toast({ variant: "error", title: "No se pudo guardar", description: message });
      setLoading(false);
    }
  }

  async function handleUpdateWithStatus(nextStatus: AppointmentStatusValue) {
    setStatus(nextStatus);

    if (!appointment || !dateValue || !timeValue) {
      return;
    }

    const startAt = buildIsoFromLocal(dateValue, timeValue);

    if (!startAt) {
      return;
    }

    setLoading(true);

    await fetch(`/api/calendar/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt,
        serviceId: serviceId || appointment.serviceId || null,
        employeeId: employeeId || appointment.employeeId || null,
        customerId: customer?.id ?? appointment.customerId ?? null,
        customerName: customer?.displayName ?? appointment.customerName ?? null,
        customerPhone: customer?.phone ?? appointment.customerPhone ?? null,
        customerEmail: customer?.email ?? appointment.customerEmail ?? null,
        notes: notes || appointment.notes || null,
        status: nextStatus,
        isUrgent,
      }),
    });

    await onUpdated?.();
    setLoading(false);
    onClose();
  }

  function handleEmployeeClick(employee: EmployeeLite, isSelected: boolean) {
    const nextEmployeeId = isSelected ? "" : employee.id;
    setEmployeeId(nextEmployeeId);

    if (!nextEmployeeId || !serviceId) {
      return;
    }

    const serviceStillAvailable = isServiceAvailableForEmployee({
      employeeServices,
      employeeId: nextEmployeeId,
      serviceId,
    });

    if (!serviceStillAvailable) {
      setServiceId("");
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
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-10 rounded-xl">
            Cerrar
          </Button>

          <button
            type="button"
            onClick={() => {
              setStatus("CANCELLED");
              void handleUpdateWithStatus("CANCELLED");
              onCancelAppointment?.();
            }}
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
            <ModalFormField label="Fecha">
              <DatePicker value={dateValue} onChange={setDateValue} />
            </ModalFormField>

            <ModalFormField label="Hora">
              <TimeSelector value={timeValue} onChange={setTimeValue} />
            </ModalFormField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ModalFormField label="Cliente">
              <CustomerPicker companyId={companyId} value={customer} onChange={setCustomer} />
            </ModalFormField>

            <ModalFormField label="Estado">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as AppointmentStatusValue)}
                className={cn(
                  MODAL_INPUT_CLASS,
                  status === "CANCELLED" &&
                    "border-rose-200 bg-rose-50 text-rose-700 focus:border-rose-300 focus:ring-rose-100"
                )}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ModalFormField>
          </div>

          <ModalFormField label="Servicio">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <SearchablePicker
                value={serviceId}
                items={availableServicePickerItems}
                placeholder="Seleccionar servicio"
                searchPlaceholder="Buscar servicio..."
                emptyText={
                  employeeId
                    ? "Este profesional no tiene servicios disponibles."
                    : "No hay servicios que coincidan."
                }
                fallbackLabel={appointment.serviceName}
                fallbackDescription={selectedService?.durationMin ? `${selectedService.durationMin} min` : null}
                onChange={setServiceId}
              />

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
          </ModalFormField>

          <ModalFormField label={serviceId ? "Profesionales compatibles" : "Profesional recomendado"}>
            <div className="flex flex-wrap gap-2">
              {compatibleEmployees.map((employee) => {
                const isSelected = employee.id === employeeId;

                return (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => handleEmployeeClick(employee, isSelected)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      isSelected
                        ? "border-[#0B6CF4] bg-[#0B6CF4] text-white shadow-[0_2px_8px_rgba(11,108,244,0.25)]"
                        : "border-border bg-white text-slate-700 hover:bg-muted/40"
                    )}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: employee.color || "#94A3B8" }} />
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
          </ModalFormField>

          {advisoryText ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{advisoryText}</span>
            </div>
          ) : null}

          <ModalFormField label="Notas">
            <ModalTextarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Añadir notas adicionales..."
              rows={3}
            />
          </ModalFormField>
        </div>
      )}
    </StandardModal>
  );
}
