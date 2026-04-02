// app/components/slots/Waitlist/WaitlistInlineCreate.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, X, Siren } from "lucide-react";
import type { WaitlistRowItem } from "./SlotsWaitlistRow";
import { WaitlistCustomerCreate } from "./WaitlistCustomerCreate";
import { WaitlistCustomerSearch } from "./WaitlistCustomerSearch";

type Props = {
  companyId: string | null;
  locationId: string | null;
  onCancel: () => void;
  onCreated: (item: WaitlistRowItem) => void;
};

type ServiceOption = {
  id: string;
  name: string;
};

type EmployeeOption = {
  id: string;
  name: string;
};

const SERVICES_LIST_ENDPOINT = "/api/slots/services/list";
const EMPLOYEES_LIST_ENDPOINT = "/api/slots/employees/list";
const WAITLIST_CREATE_ENDPOINT = "/api/slots/waitlist/create";

export function WaitlistInlineCreate({
  companyId,
  locationId,
  onCancel,
  onCreated,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string | null>(null);

  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [createCustomerDraftName, setCreateCustomerDraftName] = useState("");

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [note, setNote] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const [prefersMorning, setPrefersMorning] = useState(false);
  const [prefersAfternoon, setPrefersAfternoon] = useState(false);

  const [saving, setSaving] = useState(false);

  const [asap, setAsap] = useState(false);

  useEffect(() => {
    if (!locationId) {
      setServices([]);
      return;
    }

    const safeLocationId = locationId;
    const controller = new AbortController();

    async function loadServices() {
      try {
        const params = new URLSearchParams();
        params.set("locationId", safeLocationId);

        const response = await fetch(
          `${SERVICES_LIST_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.ok || !Array.isArray(data.services)) {
          setServices([]);
          return;
        }

        const nextServices: ServiceOption[] = data.services
          .filter((item: any) => item?.active !== false)
          .map((item: any) => ({
            id: String(item.id),
            name: String(item.name ?? ""),
          }));

        setServices(nextServices);

        if (nextServices.length > 0) {
          setSelectedServiceId(nextServices[0].id);
          setSelectedServiceName(nextServices[0].name);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("[WaitlistInlineCreate] loadServices", error);
        setServices([]);
      }
    }

    void loadServices();

    return () => controller.abort();
  }, [locationId]);

  useEffect(() => {
    if (!locationId) {
      setEmployees([]);
      return;
    }

    const safeLocationId = locationId;
    const controller = new AbortController();

    async function loadEmployees() {
      try {
        const params = new URLSearchParams();
        params.set("locationId", safeLocationId);

        const response = await fetch(
          `${EMPLOYEES_LIST_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.ok || !Array.isArray(data.employees)) {
          setEmployees([]);
          return;
        }

        const nextEmployees: EmployeeOption[] = data.employees.map((item: any) => ({
          id: String(item.id),
          name: String(item.name ?? ""),
        }));

        setEmployees(nextEmployees);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("[WaitlistInlineCreate] loadEmployees", error);
        setEmployees([]);
      }
    }

    void loadEmployees();

    return () => controller.abort();
  }, [locationId]);

const canSave = useMemo(() => {
  if (!locationId) {
    return false;
  }

  if (saving) {
    return false;
  }

  if (query.trim().length === 0) {
    return false;
  }

  if (isUrgent) {
    if (selectedEmployeeIds.length === 0) {
      return false;
    }

    if (note.trim().length === 0) {
      return false;
    }

    return true;
  }

  return selectedServiceName.trim().length > 0;
}, [
  isUrgent,
  locationId,
  note,
  query,
  saving,
  selectedEmployeeIds,
  selectedServiceName,
]);

  function handleServiceClick(service: ServiceOption) {
    setSelectedServiceId(service.id);
    setSelectedServiceName(service.name);
  }

  function handleEmployeeToggle(employeeId: string) {
    setSelectedEmployeeIds((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      }

      return [...prev, employeeId];
    });
  }

function getTimePreference(): string[] | null {
  const values: string[] = [];

  if (asap) {
    values.push("asap");
  }

  if (prefersMorning) {
    values.push("morning");
  }

  if (prefersAfternoon) {
    values.push("afternoon");
  }

  if (values.length === 0) {
    return null;
  }

  return values;
}

  function getChipClassName(isActive: boolean): string {
    if (isActive) {
      return "border-blue-300 bg-blue-50 text-blue-700";
    }

    return "border-slate-200 bg-white text-slate-600";
  }

  async function saveInlineItem() {
    const trimmedName = query.trim();
    const trimmedNote = note.trim();

    if (!locationId || trimmedName.length === 0) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(WAITLIST_CREATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId,
          customerId: selectedCustomerId,
          customerName: trimmedName,
          customerPhone: selectedCustomerPhone,
          slotRecoveryServiceId: isUrgent ? null : selectedServiceId,
          serviceName: isUrgent ? null : selectedServiceName,
          employeeIds: isUrgent ? selectedEmployeeIds : [],
          note: trimmedNote || null,
          isUrgent,
          timePreference: getTimePreference(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok || !data?.item) {
        throw new Error(data?.error || "No se pudo guardar la entrada");
      }

const created: WaitlistRowItem = {
  id: String(data.item.id),
  customerName: String(data.item.customerName ?? trimmedName),
  customerPhone: data.item.customerPhone
    ? String(data.item.customerPhone)
    : null,
  serviceName: data.item.serviceName
    ? String(data.item.serviceName)
    : null,
  note: data.item.note ? String(data.item.note) : null,
  isUrgent: Boolean(data.item.isUrgent),
  isNewCustomer,
  createdAt: String(data.item.createdAt),
  employees: Array.isArray(data.item.employees)
    ? data.item.employees.map((employee: { id: string; name: string }) => ({
        id: String(employee.id),
        name: String(employee.name ?? ""),
      }))
    : [],
};

      onCreated(created);
    } catch (error) {
      console.error("[WaitlistInlineCreate] saveInlineItem", error);
    } finally {
      setSaving(false);
    }
  }

  function handleFormKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName ?? "";

      if (tagName === "TEXTAREA") {
        return;
      }

      event.preventDefault();
      void saveInlineItem();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  }

return (
<div
  className={[
    "rounded-xl border bg-card p-3 shadow-sm transition-all duration-150",
    isUrgent
      ? "border-orange-300 shadow-[0_0_0_4px_rgba(251,146,60,0.12)]"
      : "border-border",
  ].join(" ")}
  onKeyDown={handleFormKeyDown}
>
      <div className="space-y-3">
        <WaitlistCustomerSearch
          companyId={companyId}
          value={query}
          selectedCustomerId={selectedCustomerId}
          selectedCustomerPhone={selectedCustomerPhone}
          onChangeValue={(value) => {
            setQuery(value);
            setSelectedCustomerId(null);
            setSelectedCustomerPhone(null);
          }}
          onSelectCustomer={(item) => {
            setQuery(item.fullName);
            setSelectedCustomerId(item.customerId);
            setSelectedCustomerPhone(item.phone);
            setIsNewCustomer(false);
            setShowCreateCustomer(false);
          }}
          onRequestCreate={(draftName) => {
            setCreateCustomerDraftName(draftName);
            setShowCreateCustomer(true);
          }}
        />

        {showCreateCustomer ? (
          <WaitlistCustomerCreate
            companyId={companyId}
            locationId={locationId}
            initialName={createCustomerDraftName}
            onCancel={() => setShowCreateCustomer(false)}
            onCreated={(item) => {
              setQuery(item.displayName);
              setSelectedCustomerId(item.customerId);
              setSelectedCustomerPhone(item.phone);
              setIsNewCustomer(true);
              setShowCreateCustomer(false);
            }}
          />
        ) : null}

        <div
          className={[
            "rounded-xl border px-3 py-2 transition-colors duration-150",
            isUrgent
              ? "border-orange-200 bg-orange-50"
              : "border-border bg-background",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    isUrgent
                      ? "bg-orange-100 text-orange-700"
                      : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  <Siren className="h-3.5 w-3.5" />
                </div>

                <div>
                  <p
                    className={[
                      "text-sm font-medium",
                      isUrgent ? "text-orange-900" : "text-foreground",
                    ].join(" ")}
                  >
                    Urgencia
                  </p>
                  <p
                    className={[
                      "text-[11px]",
                      isUrgent ? "text-orange-700/80" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    Priorizar esta solicitud
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !isUrgent;
                setIsUrgent(next);

                if (next) {
                  setAsap(true);
                  setPrefersMorning(true);
                  setPrefersAfternoon(true);
                  setSelectedServiceId(null);
                  setSelectedServiceName("");
                } else {
                  setSelectedEmployeeIds([]);
                }
              }}
              aria-pressed={isUrgent}
              className={[
                "relative inline-flex h-6 w-11 shrink-0 rounded-full transition",
                isUrgent ? "bg-orange-600" : "bg-slate-200",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition",
                  isUrgent ? "left-[22px]" : "left-[2px]",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        {!isUrgent ? (
          <div className="flex flex-wrap gap-1.5">
            {services.map((service) => {
              const isActive = selectedServiceId === service.id;

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceClick(service)}
                  className={[
                    "h-6 rounded-md border px-2.5 text-[11px] font-medium transition-all duration-150",
                    isActive
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-border bg-background text-muted-foreground hover:border-blue-300 hover:text-foreground",
                  ].join(" ")}
                >
                  {service.name}
                </button>
              );
            })}
          </div>
        ) : null}

{isUrgent ? (
  <div className="space-y-3 rounded-xl border border-border bg-background p-3">
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-blue-700">
        ¿Qué empleados pueden encargarse?
      </p>

      <div className="flex flex-wrap gap-1.5">
        {employees.map((employee) => {
          const isActive = selectedEmployeeIds.includes(employee.id);

          return (
            <button
              key={employee.id}
              type="button"
              onClick={() => handleEmployeeToggle(employee.id)}
              className={[
                "h-6 rounded-md border px-2.5 text-[11px] font-medium transition-all duration-150",
                isActive
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-border bg-background text-muted-foreground hover:border-blue-300 hover:text-foreground"
              ].join(" ")}
            >
              {employee.name}
            </button>
          );
        })}
      </div>
    </div>
  </div>
) : null}

{!isUrgent ? (
  <div className="space-y-3">
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Disponibilidad
      </p>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setAsap((prev) => !prev)}
          className={[
            "h-6 rounded-md border px-3 text-[11px] font-medium transition-all duration-150",
            asap
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-border bg-background text-muted-foreground hover:border-blue-300",
          ].join(" ")}
        >
          Cuanto antes
        </button>

        <button
          type="button"
          onClick={() => setPrefersMorning((prev) => !prev)}
          className={[
            "h-6 rounded-md border px-3 text-[11px] font-medium transition-all duration-150",
            prefersMorning
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-border bg-background text-muted-foreground hover:border-blue-300",
          ].join(" ")}
        >
          Mañana
        </button>

        <button
          type="button"
          onClick={() => setPrefersAfternoon((prev) => !prev)}
          className={[
            "h-6 rounded-md border px-3 text-[11px] font-medium transition-all duration-150",
            prefersAfternoon
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-border bg-background text-muted-foreground hover:border-blue-300",
          ].join(" ")}
        >
          Tarde
        </button>
      </div>
    </div>
  </div>
) : null}

        <div>
<input
  value={note}
  onChange={(event) => setNote(event.target.value)}
  placeholder={isUrgent ? "Nota obligatoria para la urgencia" : "Nota corta opcional"}
  className="h-8 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-slate-400 focus:border-blue-300"
/>
        </div>

        <div className="flex items-center justify-between gap-3">

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[11px] font-medium text-muted-foreground transition"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => void saveInlineItem()}
              disabled={!canSave}
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[11px] font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}