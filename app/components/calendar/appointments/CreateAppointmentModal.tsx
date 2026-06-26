// app/components/calendar/appointments/CreateAppointmentModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import StandardModal from "@/app/components/crussader/StandardModal";
import { Button } from "@/app/components/ui/button";
import { useActiveCompanyResolved } from "@/app/providers/bootstrap-store";
import { toast } from "@/app/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  CustomerPicker,
  type CustomerPickerValue as CustomerLite,
} from "@/app/components/crussader/UX/inputs/CustomerPicker";
import {
  ModalFormField,
  ModalTextarea,
  SearchablePicker,
  MODAL_INPUT_CLASS,
} from "@/app/components/crussader/UX/inputs";
import { DatePicker } from "@/app/components/crussader/UX/inputs/DatePicker";
import { TimeSelector } from "@/app/components/crussader/UX/inputs/TimeSelector";
import { Picklist } from "@/app/components/crussader/UX/inputs/Picklist";
import {
  buildAppointmentOptionsParams,
  buildIsoFromLocal,
  buildServicePickerItems,
  getAvailableServicePickerItems,
  getCompatibleEmployees,
  getInitials,
  getSelectedService,
  isServiceAvailableForEmployee,
  mapEmployeeServicesResponse,
  mapEmployeesResponse,
  mapServicesResponse,
  type EmployeeLite,
  type EmployeeServiceItem,
  type ServiceLite,
} from "./AppointmentModal.helpers";

type Props = {
  open: boolean;
  locationId: string;
  initialDate?: string;
  initialTime?: string;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateAppointmentModal({
  open,
  locationId,
  initialDate,
  initialTime,
  onClose,
  onCreated,
}: Props) {
  const activeCompany = useActiveCompanyResolved();
  const companyId = activeCompany?.id ?? "";

  const [services, setServices] = useState<ServiceLite[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [employeeServices, setEmployeeServices] = useState<EmployeeServiceItem[]>([]);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [status, setStatus] = useState("PENDING");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [error, setError] = useState("");

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

    return "";
  }, [employeeId, isUrgent]);

  useEffect(() => {
    if (selectedService?.durationMin) {
      setDurationMin(selectedService.durationMin);
    }
  }, [selectedService]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setLoading(false);
    setOptionsLoaded(false);
    setIsUrgent(false);
    setDate(initialDate ?? "");
    setTime(initialTime ?? "");
    setDurationMin(60);
    setServiceId("");
    setEmployeeId("");
    setCustomer(null);
    setStatus("PENDING");
    setNotes("");
  }, [initialDate, initialTime, open]);

  useEffect(() => {
    if (!open || !locationId || !companyId) {
      setServices([]);
      setEmployees([]);
      setEmployeeServices([]);
      setOptionsLoaded(true);
      return;
    }

    let cancelled = false;

    async function loadOptions() {
      try {
        const { servicesUrl, employeesUrl, employeeServicesUrl } =
          buildAppointmentOptionsParams({ companyId, locationId });
          const customersParams = new URLSearchParams();
          customersParams.set("companyId", companyId);

        const [servicesRes, employeesRes, employeeServicesRes, customersRes] =
          await Promise.all([
            fetch(servicesUrl, { method: "GET", cache: "no-store" }),
            fetch(employeesUrl, { method: "GET", cache: "no-store" }),
            fetch(employeeServicesUrl, { method: "GET", cache: "no-store" }),
            fetch(`/api/customer?${customersParams.toString()}`, {
              method: "GET",
              cache: "no-store",
            }),
          ]);

        const servicesJson = await servicesRes.json().catch(() => null);
        const employeesJson = await employeesRes.json().catch(() => null);
        const employeeServicesJson = await employeeServicesRes
          .json()
          .catch(() => null);

        const customersJson = await customersRes.json().catch(() => null);

        if (cancelled) {
          return;
        }

        const nextEmployees = mapEmployeesResponse(employeesJson);

        const nextCustomers: CustomerLite[] = Array.isArray(customersJson?.items)
  ? customersJson.items.map((item: any) => {
      return {
        id: String(item.id),
        displayName: String(
          item.displayName ?? item.name ?? "Cliente sin nombre"
        ),
        phone: item.phone ?? null,
        email: item.email ?? null,
      };
    })
  : [];

        setServices(mapServicesResponse(servicesJson));
        setEmployees(nextEmployees);
        setEmployeeServices(mapEmployeeServicesResponse(employeeServicesJson));
        setCustomers(nextCustomers);

        if (nextEmployees.length === 1) {
          setEmployeeId(nextEmployees[0].id);
        }

        setOptionsLoaded(true);
      } catch (error) {
        console.error("[CreateAppointmentModal] loadOptions", error);

        if (!cancelled) {
          setServices([]);
          setEmployees([]);
          setEmployeeServices([]);
          setCustomers([]);
          setOptionsLoaded(true);
        }
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [companyId, locationId, open]);

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
  }, [compatibleEmployees, employeeId, optionsLoaded, serviceId]);

  async function handleCreate() {
    setError("");

    if (!companyId || !locationId) {
      setError("Falta empresa o clínica activa.");
      return;
    }

    if (!customer) {
      setError("Selecciona un cliente.");
      return;
    }

    if (!date || !time) {
      setError("Selecciona fecha y hora.");
      return;
    }

    if (isUrgent && !employeeId) {
      setError("Para marcar una cita como urgente, asigna un profesional.");
      return;
    }

    const startAt = buildIsoFromLocal(date, time);

    if (!startAt) {
      setError("Fecha u hora no válidas.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/calendar/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          serviceId: serviceId || null,
          startAt,
          durationMin,
          status,
          customerId: customer.id,
          customerName: customer.displayName,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          employeeId: employeeId || null,
          notes: notes || null,
          isUrgent,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const message = json?.error || "No se pudo crear la cita.";
        setError(message);
        toast({ variant: "error", title: "No se pudo crear", description: message });
        setLoading(false);
        return;
      }

      toast({
        variant: "success",
        title: "Cita creada",
        description: "La cita se ha creado correctamente.",
      });

      await onCreated();
      setLoading(false);
      onClose();
    } catch (error) {
      console.error("[CreateAppointmentModal] handleCreate", error);

      const message = "Error inesperado creando la cita.";
      setError(message);
      toast({ variant: "error", title: "No se pudo crear", description: message });
      setLoading(false);
    }
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

  return (
    <StandardModal
      open={open}
      title="Crear cita"
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-10 rounded-xl">
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="h-10 gap-2 rounded-xl bg-crussader px-5 font-semibold text-white hover:bg-crussader/90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando
              </>
            ) : (
              "Crear cita"
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
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ModalFormField label="Fecha">
              <DatePicker value={date} onChange={setDate} />
            </ModalFormField>

            <ModalFormField label="Hora">
              <TimeSelector value={time} onChange={setTime} />
            </ModalFormField>

            <ModalFormField label="Duración">
<Picklist
  value={durationMin}
  options={[
    { value: 15, label: "15 min" },
    { value: 30, label: "30 min" },
    { value: 45, label: "45 min" },
    { value: 60, label: "60 min" },
    { value: 75, label: "75 min" },
    { value: 90, label: "90 min" },
    { value: 120, label: "120 min" },
  ]}
  onChange={(nextValue) => {
    if (nextValue === "") {
      return;
    }

    setDurationMin(nextValue);
  }}
/>
            </ModalFormField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ModalFormField label="Cliente">
              <CustomerPicker
                value={customer}
                customers={customers}
                onChange={setCustomer}
              />
            </ModalFormField>

<ModalFormField label="Estado">
  <Picklist
    value={status}
    options={[
      { value: "PENDING", label: "Pendiente" },
      { value: "CONFIRMED", label: "Confirmada" },
    ]}
    onChange={(nextValue) => {
      if (nextValue === "") {
        return;
      }

      setStatus(nextValue);
    }}
  />
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

          <ModalFormField label={serviceId ? "Profesionales compatibles" : "Selecciona un empleado"}>
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
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white"
                      style={{ backgroundColor: employee.color || "#94A3B8" }}
                    >
                      {getInitials(employee.name)}
                    </span>
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
