// app/components/slots/Waitlist/WaitlistInlineCreate.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import type { WaitlistRowItem } from "./SlotsWaitlistRow";

type Props = {
  locationId: string | null;
  onCancel: () => void;
  onCreated: (item: WaitlistRowItem) => void;
};

type ServiceOption = {
  id: string;
  name: string;
};

type CustomerSuggestion = {
  customerId: string;
  displayName: string;
  phone: string | null;
};

const SERVICES_LIST_ENDPOINT = "/api/slots/services/list";
const WAITLIST_CREATE_ENDPOINT = "/api/slots/waitlist/create";
const CUSTOMER_SEARCH_ENDPOINT = "/api/slots/customers/list";

export function WaitlistInlineCreate({
  locationId,
  onCancel,
  onCreated,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [note, setNote] = useState("");
const [isUrgent, setIsUrgent] = useState(false);

const [dayToday, setDayToday] = useState(false);
const [dayTomorrow, setDayTomorrow] = useState(false);
const [dayNextDays, setDayNextDays] = useState(false);

const [prefersMorning, setPrefersMorning] = useState(false);
const [prefersAfternoon, setPrefersAfternoon] = useState(false);

  const [saving, setSaving] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    setCustomerSuggestions([]);
    return;
  }

  const safeLocationId = locationId;
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    setCustomerSuggestions([]);
    return;
  }

  const controller = new AbortController();

  async function loadSuggestions() {
    try {
      setLoadingSuggestions(true);

      const params = new URLSearchParams();
      params.set("locationId", safeLocationId);
        params.set("limit", "8");
        params.set("q", trimmed);

        const response = await fetch(
          `${CUSTOMER_SEARCH_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.ok || !Array.isArray(data.items)) {
          setCustomerSuggestions([]);
          return;
        }

        const nextSuggestions: CustomerSuggestion[] = data.items
          .filter((item: any) => item?.customerId)
          .map((item: any) => ({
            customerId: String(item.customerId),
            displayName: String(item?.customer?.displayName ?? "Sin nombre"),
            phone: item?.customer?.phone ? String(item.customer.phone) : null,
          }));

        setCustomerSuggestions(nextSuggestions);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("[WaitlistInlineCreate] loadSuggestions", error);
        setCustomerSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }

    const timeout = window.setTimeout(() => {
      void loadSuggestions();
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [locationId, query]);

  const canSave = useMemo(() => {
    return (
      Boolean(locationId) &&
      query.trim().length > 0 &&
      selectedServiceName.trim().length > 0 &&
      saving === false
    );
  }, [locationId, query, selectedServiceName, saving]);

  function handleSelectSuggestion(item: CustomerSuggestion) {
    setSelectedCustomerId(item.customerId);
    setSelectedCustomerPhone(item.phone);
    setQuery(item.displayName);
    setCustomerSuggestions([]);
  }

  function handleServiceClick(service: ServiceOption) {
    setSelectedServiceId(service.id);
    setSelectedServiceName(service.name);
  }
  
function getTimePreference(): string[] | null {
  const values: string[] = [];

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

function getDayPreference(): string[] | null {
  const values: string[] = [];

  if (dayToday) {
    values.push("today");
  }

  if (dayTomorrow) {
    values.push("tomorrow");
  }

  if (dayNextDays) {
    values.push("next_days");
  }

  if (values.length === 0) {
    return null;
  }

  return values;
}

function handleUrgencyToggle() {
  const nextValue = !isUrgent;
  setIsUrgent(nextValue);

  if (nextValue) {
    setDayToday(true);
    setDayTomorrow(true);
  }
}

function getChipClassName(isActive: boolean): string {
  return isActive
    ? "border-blue-300 bg-blue-50 text-blue-700"
    : "border-slate-200 bg-white text-slate-600";
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
  slotRecoveryServiceId: selectedServiceId,
  serviceName: selectedServiceName,
  note: trimmedNote || null,
  isUrgent,
  timePreference: getTimePreference(),
  dayPreference: getDayPreference(),
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
        createdAt: String(data.item.createdAt),
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
      className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3 shadow-sm"
      onKeyDown={handleFormKeyDown}
    >
      <div className="space-y-3">
        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedCustomerId(null);
              setSelectedCustomerPhone(null);
            }}
            placeholder="Buscar cliente o escribir nombre..."
            className="h-10 w-full rounded-xl border border-blue-200 bg-white px-3 pr-9 text-sm text-foreground outline-none ring-0 placeholder:text-slate-400 focus:border-blue-400"          />
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          {query.trim().length >= 2 && customerSuggestions.length > 0 ? (
            <div className="absolute left-0 right-0 top-[44px] z-20 rounded-xl border border-border/60 bg-white p-1 shadow-lg">
              {customerSuggestions.map((item) => {
                return (
                  <button
                    key={item.customerId}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-muted/50"
                  >
                    <span className="truncate text-sm text-foreground">
                      {item.displayName}
                    </span>
                    <span className="ml-3 shrink-0 text-[11px] text-muted-foreground">
                      {item.phone || "Sin teléfono"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {query.trim().length >= 2 && loadingSuggestions ? (
            <div className="absolute right-9 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {services.map((service) => {
            const isActive = selectedServiceId === service.id;
            const serviceClassName = isActive
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600";

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => handleServiceClick(service)}
                className={[
                  "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                  serviceClassName,
                ].join(" ")}
              >
                {service.name}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
  <div>
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      Franja
    </p>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setPrefersMorning((prev) => !prev)}
        className={[
          "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
          getChipClassName(prefersMorning),
        ].join(" ")}
      >
        Mañana
      </button>

      <button
        type="button"
        onClick={() => setPrefersAfternoon((prev) => !prev)}
        className={[
          "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
          getChipClassName(prefersAfternoon),
        ].join(" ")}
      >
        Tarde
      </button>

      {prefersMorning && prefersAfternoon ? (
        <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700">
          Cuanto antes
        </span>
      ) : null}
    </div>
  </div>

  <div>
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      Preferencia de día
    </p>

<div className="flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => setDayToday((prev) => !prev)}
    className={[
      "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
      getChipClassName(dayToday),
    ].join(" ")}
  >
    Hoy
  </button>

  <button
    type="button"
    onClick={() => setDayTomorrow((prev) => !prev)}
    className={[
      "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
      getChipClassName(dayTomorrow),
    ].join(" ")}
  >
    Mañana
  </button>

  <button
    type="button"
    onClick={() => setDayNextDays((prev) => !prev)}
    className={[
      "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
      getChipClassName(dayNextDays),
    ].join(" ")}
  >
    Próximos días
  </button>
</div>
  </div>

  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">Urgencia</p>
      <p className="text-[11px] text-muted-foreground">
        Priorizar esta solicitud
      </p>
    </div>

    <button
      type="button"
      onClick={() => setIsUrgent((prev) => !prev)}
      aria-pressed={isUrgent}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 rounded-full transition",
        isUrgent ? "bg-blue-600" : "bg-slate-200",
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

        <div>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Nota corta opcional"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none ring-0 placeholder:text-slate-400 focus:border-blue-300"          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            Enter para guardar · Esc para cancelar
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => void saveInlineItem()}
              disabled={!canSave}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[11px] font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
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