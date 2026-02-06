// app/components/calendar/CreateAppointmentModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import SearchPicker from "@/app/components/crussader/SearchPicker";

type LocationLite = { id: string; title: string; city: string | null; timezone: string | null };
type ServiceLite  = { id: string; name: string; durationMin: number; color?: string | null };
type EmployeeLite = { id: string; name: string; color?: string | null; active?: boolean };
type ResourceLite = { id: string; name: string; notes?: string | null; capacity?: number | null };
type CustomerRow = { id: string; firstName: string; lastName: string; email?: string | null; phone: string };

const NONE_EMP = "__none_emp__";
const NONE_RES = "__none_res__";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate?: Date;
  onCreated?: () => void;
  presetLocationId?: string;
  presetCompanyId?: string;
};

export default function CreateAppointmentModal({
  open, onOpenChange, defaultDate, onCreated, presetLocationId, presetCompanyId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ubicaciones
  const [locations, setLocations] = useState<LocationLite[]>([]);
  const [locationId, setLocationId] = useState<string>("");

  // fecha/hora
  const [dateStr, setDateStr] = useState<string>("");
  const [timeStr, setTimeStr] = useState<string>("10:00");

  // servicios
  const [serviceId, setServiceId] = useState<string>("");
  const [customService, setCustomService] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDuration, setCustomDuration] = useState<number>(30);

  // asignaciones
  const [employeeId, setEmployeeId] = useState<string>(NONE_EMP);
  const [resourceId, setResourceId] = useState<string>(NONE_RES);

  // cliente
  const [notes, setNotes] = useState("");

  // ==== Cliente existente o nuevo ====
  const [companyId, setCompanyId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  const [newFirst, setNewFirst]   = useState("");
  const [newLast, setNewLast]     = useState("");
  const [newPhone, setNewPhone]   = useState("");
  const [newEmail, setNewEmail]   = useState("");

  const canSubmit = useMemo(() => {
    if (!locationId || !dateStr || !timeStr) return false;
    if (!customService ? !serviceId : !(customName && customDuration > 0)) return false;
    if (!createNewCustomer) return true; // cliente opcional si no se crea uno nuevo
    return !!(newFirst && newLast && newPhone);
  }, [locationId, dateStr, timeStr, customService, serviceId, customName, customDuration, createNewCustomer, newFirst, newLast, newPhone]);

  /* ===========================
     Helpers fetchers para SearchPicker
     =========================== */

  const fetchLocationsSP = async (q: string): Promise<LocationLite[]> => {
    // Si tu endpoint no soporta q, ignorarlo. Aquí usamos el que ya tienes:
    const res = await fetch("/api/calendar/locations", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data?.ok === false) return [];
    const items: LocationLite[] = data.items || [];
    if (!q) return items;
    // filtrado en cliente por estética
    const ql = q.toLowerCase();
    return items.filter(l => (`${l.title} ${l.city ?? ""} ${l.timezone ?? ""}`).toLowerCase().includes(ql));
  };
  const labelOfLocation = (l: LocationLite) =>
    `${l.title}${l.city ? ` · ${l.city}` : ""}${l.timezone ? ` · ${l.timezone}` : ""}`;

  const fetchServicesSP = async (q: string): Promise<ServiceLite[]> => {
    if (!locationId) return [];
    const res = await fetch(`/api/calendar/services?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data?.ok === false) return [];
    const items: ServiceLite[] = data.items || [];
    if (!q) return items;
    const ql = q.toLowerCase();
    return items.filter(s => `${s.name}`.toLowerCase().includes(ql));
  };
  const labelOfService = (s: ServiceLite) => `${s.name} · ${s.durationMin} min`;

  const fetchEmployeesSP = async (q: string): Promise<EmployeeLite[]> => {
    if (!locationId) return [];
    const res = await fetch(`/api/calendar/employees?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data?.error) return [];
    const items: EmployeeLite[] = data.items || [];
    if (!q) return items;
    const ql = q.toLowerCase();
    return items.filter(e => `${e.name ?? e.id}`.toLowerCase().includes(ql));
  };
  const labelOfEmployee = (e: EmployeeLite) => e.name || e.id;

  const fetchResourcesSP = async (q: string): Promise<ResourceLite[]> => {
    if (!locationId) return [];
    const res = await fetch(`/api/calendar/resources?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data?.error) return [];
    const items: ResourceLite[] = data.items || [];
    if (!q) return items;
    const ql = q.toLowerCase();
    return items.filter(r => `${r.name ?? r.id}`.toLowerCase().includes(ql));
  };
  const labelOfResource = (r: ResourceLite) => r.name || r.id;

  const fetchCustomersSP = async (q: string): Promise<CustomerRow[]> => {
    if (!companyId) return [];
    const res = await fetch(`/api/calendar/customers?companyId=${encodeURIComponent(companyId)}&q=${encodeURIComponent(q)}&limit=10`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data?.ok === false) return [];
    return (data.items || []) as CustomerRow[];
  };
  const labelOfCustomer = (c: CustomerRow) =>
    `${c.firstName} ${c.lastName} · ${c.phone}${c.email ? ` · ${c.email}` : ""}`;

  /* ===========================
     Ciclos de vida
     =========================== */

  // abrir modal: setear fecha y companyId preferido, y precargar ubicaciones
  useEffect(() => {
    if (!open) return;
    setMsg("");
    setSelectedCustomerId("");
    setCreateNewCustomer(false);
    setNewFirst(""); setNewLast(""); setNewPhone(""); setNewEmail("");
    const d = defaultDate ?? new Date();
    setDateStr(d.toISOString().slice(0, 10));
    if (presetCompanyId) setCompanyId(presetCompanyId);

    (async () => {
      try {
        const resp = await fetch("/api/calendar/locations", { cache: "no-store" });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          setMsg(data?.error || "No se pudieron cargar ubicaciones");
          setLocations([]);
          return;
        }
        const items: LocationLite[] = data.items || [];
        setLocations(items);

        const preferred = presetLocationId && items.find(x => x.id === presetLocationId)?.id;
        const demo = items.find((x) => x.id === "loc_demo_centro_01");
        const first = preferred || demo?.id || items[0]?.id || "";
        setLocationId(first);
      } catch (e: any) {
        setMsg(e.message || "Error cargando ubicaciones");
        setLocations([]);
      }
    })();
  }, [open, defaultDate, presetLocationId, presetCompanyId]);

  // reset fuerte al cerrar
  useEffect(() => {
    if (!open) {
      setSelectedCustomerId("");
      setCreateNewCustomer(false);
      setNewFirst(""); setNewLast(""); setNewPhone(""); setNewEmail("");
      setMsg("");
    }
  }, [open]);

  /* ===========================
     Submit
     =========================== */

  async function handleSubmit() {
    try {
      setLoading(true);
      setMsg("");

      if (!locationId) { setMsg("Selecciona ubicación"); return; }
      if (!customService && !serviceId) { setMsg("Selecciona servicio"); return; }

      const startISO = new Date(`${dateStr}T${timeStr}:00`).toISOString();

      const payload: any = {
        locationId,
        startAt: startISO,
        status: "BOOKED",
        notes: notes || undefined,
        serviceId: !customService ? serviceId : null, // si custom, el server calculará/permitirá nota
      };

      if (customService) {
        payload.notes = (payload.notes ? payload.notes + " | " : "") +
          `Servicio custom: ${customName || "Sin nombre"} (${customDuration || 30} min)`;
      }

      if (employeeId && employeeId !== NONE_EMP) payload.employeeId = employeeId;
      if (resourceId && resourceId !== NONE_RES) payload.resourceId = resourceId;

      // === Cliente
      if (!createNewCustomer) {
        if (selectedCustomerId) payload.customerId = selectedCustomerId; // existente
      } else {
        if (!companyId) { setMsg("No hay companyId para crear el cliente"); setLoading(false); return; }
        payload.newCustomer = {
          companyId,
          firstName: newFirst.trim(),
          lastName:  newLast.trim(),
          phone:     newPhone.trim(),
          email:     newEmail.trim() || null,
        };
      }

      const res = await fetch("/api/calendar/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} (${res.statusText}) — ${text.slice(0, 180)}`);
      }

      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      setMsg(e.message || "Error creando la reserva");
    } finally {
      setLoading(false);
    }
  }

  /* ===========================
     UI
     =========================== */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Ubicación */}
          <div>
            <Label>Ubicación *</Label>
            <SearchPicker<LocationLite>
              value={locationId || null}
              onChange={(id) => setLocationId(id || "")}
              fetcher={fetchLocationsSP}
              getLabel={labelOfLocation}
              placeholder="Selecciona ubicación"
              inputPlaceholder="Buscar ubicación…"
              inputProps={{ autoComplete: "off" }}
            />
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha *</Label>
              <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <Label>Hora inicio *</Label>
              <Input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} autoComplete="off" />
            </div>
          </div>

          {/* Servicio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Servicio</Label>
              <Button variant="outline" size="sm" onClick={() => setCustomService((v) => !v)}>
                {customService ? "Usar listado" : "Otro servicio"}
              </Button>
            </div>

            {!customService ? (
              <SearchPicker<ServiceLite>
                value={serviceId || null}
                onChange={(id) => setServiceId(id || "")}
                fetcher={fetchServicesSP}
                getLabel={labelOfService}
                placeholder="Selecciona servicio"
                inputPlaceholder="Buscar servicio…"
                disabled={!locationId}
                inputProps={{ autoComplete: "off" }}
              />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Nombre servicio</Label>
                  <Input autoComplete="off" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Descripción breve" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Duración (min)</Label>
                  <Input
                    autoComplete="off"
                    type="number" min={5} step={5}
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value || 0))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Asignaciones */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Empleado (opcional)</Label>
              <SearchPicker<EmployeeLite>
                value={employeeId === NONE_EMP ? null : employeeId}
                onChange={(id) => setEmployeeId(id || NONE_EMP)}
                fetcher={fetchEmployeesSP}
                getLabel={labelOfEmployee}
                placeholder="Sin asignar"
                inputPlaceholder="Buscar empleado…"
                disabled={!locationId}
                allowClear
                inputProps={{ autoComplete: "off" }}
              />
            </div>

            <div>
              <Label>Recurso (opcional)</Label>
              <SearchPicker<ResourceLite>
                value={resourceId === NONE_RES ? null : resourceId}
                onChange={(id) => setResourceId(id || NONE_RES)}
                fetcher={fetchResourcesSP}
                getLabel={labelOfResource}
                placeholder="Sin asignar"
                inputPlaceholder="Buscar recurso…"
                disabled={!locationId}
                allowClear
                inputProps={{ autoComplete: "off" }}
              />
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cliente</Label>
              <Button
                variant="outline" size="sm"
                onClick={() => {
                  const next = !createNewCustomer;
                  setCreateNewCustomer(next);
                  if (next) { setSelectedCustomerId(""); }
                  else { setNewFirst(""); setNewLast(""); setNewPhone(""); setNewEmail(""); }
                }}
              >
                {createNewCustomer ? "Buscar existente" : "Nuevo cliente"}
              </Button>
            </div>

            {!createNewCustomer ? (
              <SearchPicker<CustomerRow>
                value={selectedCustomerId || null}
                onChange={(id) => setSelectedCustomerId(id || "")}
                fetcher={fetchCustomersSP}
                getLabel={labelOfCustomer}
                placeholder="Selecciona cliente (opcional)"
                inputPlaceholder="Nombre, email o teléfono…"
                disabled={!companyId}
                inputProps={{ autoComplete: "off" }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Nombre *</Label>
                  <Input autoComplete="off" value={newFirst} onChange={(e)=>setNewFirst(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Apellidos *</Label>
                  <Input autoComplete="off" value={newLast} onChange={(e)=>setNewLast(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Teléfono *</Label>
                  <Input autoComplete="off" value={newPhone} onChange={(e)=>setNewPhone(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input autoComplete="off" type="email" value={newEmail} onChange={(e)=>setNewEmail(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <Label>Notas</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Información adicional..." autoComplete="off" />
          </div>

          {/* Mensajes y acciones */}
          {msg && <p className="text-sm">{msg}</p>}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" disabled={!canSubmit || loading} onClick={handleSubmit}>
              {loading ? "Creando…" : "Crear reserva"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
