// app/components/calendar/appointments/CreateAppointmentModal.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import StandardModal from "@/app/components/crussader/StandardModal";
import { useActiveCompanyResolved } from "@/app/providers/bootstrap-store";

type ServiceLite = {
  id: string;
  name: string;
  durationMin?: number;
  priceCents?: number;
};

type EmployeeLite = {
  id: string;
  name: string;
  role: string;
  color: string;
  isPrimary: boolean;
};

type CustomerLite = {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
};

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

  const [serviceId, setServiceId] = useState("");
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");

    if (initialDate) {
      setDate(initialDate);
    }

    if (initialTime) {
      setTime(initialTime);
    }
  }, [open, initialDate, initialTime]);

  const selectedService = useMemo(() => {
    return services.find((service) => service.id === serviceId) ?? null;
  }, [services, serviceId]);

  const selectedEmployee = useMemo(() => {
    return employees.find((employee) => employee.id === employeeId) ?? null;
  }, [employees, employeeId]);

  useEffect(() => {
    if (!open || !locationId || !companyId) {
      return;
    }

    async function loadOptions() {
      try {
        const paramsServices = new URLSearchParams();
        paramsServices.set("companyId", companyId);

        if (employeeId) {
          paramsServices.set("employeeId", employeeId);
        }

        const paramsEmployees = new URLSearchParams();
        paramsEmployees.set("locationId", locationId);

        if (serviceId) {
          paramsEmployees.set("serviceId", serviceId);
        }

        const [servicesRes, employeesRes] = await Promise.all([
          fetch(`/api/service?${paramsServices.toString()}`),
          fetch(`/api/employee?${paramsEmployees.toString()}`),
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

    if (!serviceId && !employeeId) {
      setError("Selecciona al menos un servicio o un empleado.");
      return;
    }

    setLoading(true);

    try {
      const startAt = new Date(`${date}T${time}`);

      const res = await fetch("/api/calendar/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId,
          serviceId: serviceId || null,
          startAt: startAt.toISOString(),
          customerId: customer.id,
          customerName: customer.displayName,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          employeeId: employeeId || null,
          notes: notes || null,
          status: "BOOKED",
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setError(json?.error || "No se pudo crear la cita.");
        return;
      }

      onClose();
      onCreated();

      setServiceId("");
      setCustomer(null);
      setEmployeeId("");
      setDate("");
      setTime("");
      setNotes("");
      setError("");
    } catch {
      setError("Error inesperado creando la cita.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StandardModal
      open={open}
      title="Nueva cita"
      primaryLabel={loading ? "Creando..." : "Crear cita"}
      onPrimary={handleCreate}
      onClose={onClose}
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <Field label="Cliente">
          <CustomerPicker companyId={companyId} value={customer} onChange={setCustomer} />
        </Field>

        <Field label="Servicio">
          <Picklist
            valueLabel={selectedService?.name ?? ""}
            placeholder="Seleccionar servicio"
            emptyLabel="Sin servicio concreto"
            onClear={() => setServiceId("")}
          >
            {services.map((service) => (
              <PicklistItem
                key={service.id}
                onClick={() => setServiceId(service.id)}
                selected={service.id === serviceId}
              >
                <span className="text-sm font-medium text-slate-900">
                  {service.name}
                </span>
              </PicklistItem>
            ))}
          </Picklist>
        </Field>

        <Field label="Empleado">
          <Picklist
            valueLabel={selectedEmployee?.name ?? ""}
            placeholder="Seleccionar empleado"
            emptyLabel="Sin asignar"
            onClear={() => setEmployeeId("")}
          >
            {employees.map((employee) => (
              <PicklistItem
                key={employee.id}
                onClick={() => setEmployeeId(employee.id)}
                selected={employee.id === employeeId}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: employee.color || "#CBD5E1" }}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">{employee.name}</p>
                  <p className="text-xs text-slate-500">{employee.role}</p>
                </div>
              </PicklistItem>
            ))}
          </Picklist>
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

function CustomerPicker({
  companyId,
  value,
  onChange,
}: {
  companyId: string;
  value: CustomerLite | null;
  onChange: (customer: CustomerLite | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CustomerLite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId || value || !open) {
      setItems([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("companyId", companyId);

        if (query.trim()) {
          params.set("q", query.trim());
        }

        const res = await fetch(`/api/customer?${params.toString()}`);
        const json = await res.json().catch(() => null);

        setItems(Array.isArray(json?.items) ? json.items : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [companyId, query, value, open]);

  async function handleCreate() {
    if (!companyId || !query.trim()) {
      return;
    }

    const res = await fetch("/api/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        firstName: query.trim(),
        phone: null,
        email: null,
      }),
    });

    const json = await res.json().catch(() => null);

    if (json?.ok && json.item) {
      onChange(json.item);
      setQuery("");
      setItems([]);
      setOpen(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-slate-900">{value.displayName}</p>
          <p className="text-xs text-slate-500">
            {[value.phone, value.email].filter(Boolean).join(" · ") || "Sin contacto"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-sm font-medium text-red-500"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Buscar por nombre, teléfono o email"
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
      />

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {loading ? (
            <p className="px-3 py-2 text-xs text-slate-500">Buscando...</p>
          ) : null}

          {!loading &&
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item);
                  setQuery("");
                  setItems([]);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-slate-50"
              >
                <p className="text-sm font-medium text-slate-900">{item.displayName}</p>
                <p className="text-xs text-slate-500">
                  {[item.phone, item.email].filter(Boolean).join(" · ") || "Sin contacto"}
                </p>
              </button>
            ))}

          {!loading && items.length === 0 && query.trim().length > 0 ? (
            <button
              type="button"
              onClick={handleCreate}
              className="block w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Crear cliente “{query.trim()}”
            </button>
          ) : null}

          {!loading && items.length === 0 && query.trim().length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">
              No hay clientes recientes
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Picklist({
  valueLabel,
  placeholder,
  emptyLabel,
  onClear,
  children,
}: {
  valueLabel: string;
  placeholder: string;
  emptyLabel: string;
  onClear: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left"
      >
        <span className={valueLabel ? "text-sm text-slate-900" : "text-sm text-slate-400"}>
          {valueLabel || placeholder}
        </span>
        <span className="text-xs text-slate-400">▾</span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          <button
            type="button"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="text-sm font-medium text-slate-700">{emptyLabel}</span>
          </button>

          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      ) : null}
    </div>
  );
}

function PicklistItem({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
        selected ? "bg-violet-50" : "hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}