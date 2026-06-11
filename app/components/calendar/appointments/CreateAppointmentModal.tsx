// app/components/calendar/appointments/CreateAppointmentModal.tsx
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
  priceCents?: number;
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

type Props = {
  open: boolean;
  locationId: string;
  initialDate?: string;
  initialTime?: string;
  onClose: () => void;
  onCreated: () => void;
};

const FIELD_LABEL_CLASS =
  "text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500";

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100";

const TEXTAREA_CLASS =
  "min-h-[92px] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100";

const PICKER_BUTTON_CLASS =
  "flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-sm shadow-sm transition hover:bg-slate-50";

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

const [serviceId, setServiceId] = useState("");
const [customer, setCustomer] = useState<CustomerLite | null>(null);
const [employeeId, setEmployeeId] = useState("");
const [date, setDate] = useState("");
const [time, setTime] = useState("");
const [durationMin, setDurationMin] = useState(60);
const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [error, setError] = useState("");

  const serviceDropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedService = useMemo(() => {
    return services.find((service) => service.id === serviceId) ?? null;
  }, [services, serviceId]);

  useEffect(() => {
  if (selectedService?.durationMin) {
    setDurationMin(selectedService.durationMin);
  }
}, [selectedService]);

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

    return "";
  }, [isUrgent, employeeId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setLoading(false);
    setOptionsLoaded(false);
    setServiceDropdownOpen(false);
    setServiceSearch("");
    setIsUrgent(false);

    setDate(initialDate ?? "");
    setTime(initialTime ?? "");
    setDurationMin(30);
    setServiceId("");
    setEmployeeId("");
    setCustomer(null);
    setNotes("");
  }, [open, initialDate, initialTime]);

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
                priceCents: Number(item.priceCents ?? item.price_cents ?? 0),
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId,
          serviceId: serviceId || null,
          startAt,
          durationMin,
          customerId: customer.id,
          customerName: customer.displayName,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          employeeId: employeeId || null,
          notes: notes || null,
          status: "BOOKED",
          isUrgent,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const message = json?.error || "No se pudo crear la cita.";
        setError(message);

        toast({
          variant: "error",
          title: "No se pudo crear la cita",
          description: message,
        });

        setLoading(false);
        return;
      }

      toast({
        variant: "success",
        title: "Cita creada",
        description: "La cita se ha añadido correctamente al calendario.",
      });

      setLoading(false);
      onClose();
      onCreated();

      setServiceId("");
      setCustomer(null);
      setEmployeeId("");
      setDate("");
      setTime("");
      setNotes("");
      setIsUrgent(false);
      setError("");
    } catch (error) {
      console.error("[CreateAppointmentModal] handleCreate", error);

      const message = "Error inesperado creando la cita.";
      setError(message);

      toast({
        variant: "error",
        title: "No se pudo crear la cita",
        description: message,
      });

      setLoading(false);
    }
  }

  return (
    <StandardModal
      open={open}
      title="Nueva cita"
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

          <Button
            type="button"
            onClick={handleCreate}
            disabled={loading || !optionsLoaded}
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
        <div className="space-y-3 px-4 pt-0">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Fecha">
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

<Field label="Hora">
  <Input
    type="time"
    step={300}
    value={time}
    onChange={(event) => setTime(event.target.value)}
    className={`${INPUT_CLASS} tabular-nums`}
  />
</Field>

<Field label="Duración">
  <select
    value={durationMin}
    onChange={(event) => setDurationMin(Number(event.target.value))}
    className={INPUT_CLASS}
  >
    <option value={30}>30 min</option>
    <option value={45}>45 min</option>
    <option value={60}>60 min</option>
    <option value={90}>90 min</option>
  </select>
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
              <div className={`${INPUT_CLASS} flex items-center text-slate-700`}>
                Confirmada
              </div>
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
                      {selectedService?.name ?? "Seleccionar servicio"}
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
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold"
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "P";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}