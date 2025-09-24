"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";

type LocationLite = { id: string; title: string; city: string | null; timezone: string | null };
type ServiceLite  = { id: string; name: string; durationMin: number; color?: string | null };
type EmployeeLite = { id: string; name: string; color?: string | null; active?: boolean };
type ResourceLite = { id: string; name: string; notes?: string | null; capacity?: number | null };

const NONE_EMP = "__none_emp__";
const NONE_RES = "__none_res__";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate?: Date;
  onCreated?: () => void;
};

export default function CreateAppointmentModal({ open, onOpenChange, defaultDate, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ubicaciones
  const [locations, setLocations] = useState<LocationLite[]>([]);
  const [locationId, setLocationId] = useState<string>("");

  // fecha/hora
  const [dateStr, setDateStr] = useState<string>("");
  const [timeStr, setTimeStr] = useState<string>("10:00");

  // servicios
  const [services, setServices] = useState<ServiceLite[]>([]);
  const [serviceId, setServiceId] = useState<string>("");
  const [customService, setCustomService] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDuration, setCustomDuration] = useState<number>(30);
  const [servicesLoading, setServicesLoading] = useState(false);

  // asignaciones
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [resources, setResources] = useState<ResourceLite[]>([]);
  const [employeeId, setEmployeeId] = useState<string>(NONE_EMP);
  const [resourceId, setResourceId] = useState<string>(NONE_RES);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // cliente
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = useMemo(() => {
    if (!locationId || !dateStr || !timeStr) return false;
    if (!customService) return !!serviceId;
    return !!customName && customDuration > 0;
  }, [locationId, dateStr, timeStr, customService, serviceId, customName, customDuration]);

  // al abrir
  useEffect(() => {
    if (!open) return;
    setMsg("");
    const d = defaultDate ?? new Date();
    setDateStr(d.toISOString().slice(0, 10));

    (async () => {
      try {
        const res = await fetch("/api/locations/me", { cache: "no-store" }).catch(() => null);
        const resp = res && res.ok ? res : await fetch("/api/calendar/locations", { cache: "no-store" });
        const data = await resp.json();

        if (!resp.ok || !data.ok) {
          setMsg(data?.error || "No se pudieron cargar ubicaciones");
          setLocations([]);
          return;
        }
        const items: LocationLite[] = data.items || [];
        setLocations(items);

        const demo = items.find((x) => x.id === "loc_demo_centro_01");
        const first = demo?.id || items[0]?.id || "";
        setLocationId(first);
      } catch (e: any) {
        setMsg(e.message || "Error cargando ubicaciones");
        setLocations([]);
      }
    })();
  }, [open, defaultDate]);

  // al cambiar ubicación: cargar servicios, empleados y recursos
  useEffect(() => {
    if (!open || !locationId) {
      setServices([]); setServiceId("");
      setEmployees([]); setEmployeeId(NONE_EMP);
      setResources([]); setResourceId(NONE_RES);
      return;
    }

    // reset
    setServiceId("");
    setEmployeeId(NONE_EMP);
    setResourceId(NONE_RES);

    // Servicios
    (async () => {
      setServicesLoading(true);
      try {
        const rs = await fetch(`/api/calendar/services?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
        const ds = await rs.json();
        if (!rs.ok || !ds.ok) throw new Error(ds?.error || "No se pudieron cargar servicios");
        const items: ServiceLite[] = ds.items || [];
        setServices(items);
        setServiceId(items[0]?.id || "");
      } catch (e: any) {
        setMsg(e.message);
        setServices([]); setServiceId("");
      } finally {
        setServicesLoading(false);
      }
    })();

    // Empleados
    (async () => {
      setEmployeesLoading(true);
      try {
        const re = await fetch(`/api/calendar/employees?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
        const de = await re.json();
        if (!re.ok || de?.error) throw new Error(de?.error || "No se pudieron cargar empleados");
        const items: EmployeeLite[] = de.items || [];
        setEmployees(items);
        setEmployeeId(NONE_EMP); // por defecto "Sin asignar"
      } catch (e: any) {
        setMsg(e.message);
        setEmployees([]); setEmployeeId(NONE_EMP);
      } finally {
        setEmployeesLoading(false);
      }
    })();

    // Recursos
    (async () => {
      setResourcesLoading(true);
      try {
        const rr = await fetch(`/api/calendar/resources?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
        const dr = await rr.json();
        if (!rr.ok || dr?.error) throw new Error(dr?.error || "No se pudieron cargar recursos");
        const items: ResourceLite[] = dr.items || [];
        setResources(items);
        setResourceId(NONE_RES); // por defecto "Sin asignar"
      } catch (e: any) {
        setMsg(e.message);
        setResources([]); setResourceId(NONE_RES);
      } finally {
        setResourcesLoading(false);
      }
    })();
  }, [open, locationId]);

  async function handleSubmit() {
    try {
      setLoading(true);
      setMsg("");
      const startISO = new Date(`${dateStr}T${timeStr}:00`).toISOString();

      const payload: any = {
        locationId,
        startAt: startISO,
        status: "BOOKED",
        customerName: customerName || undefined,
        notes: notes || undefined,
      };

      // servicio
      if (!customService) {
        payload.serviceId = serviceId;
      } else {
        payload.serviceId = services[0]?.id || null;
        payload.notes = (payload.notes ? payload.notes + " | " : "") +
          `Servicio custom: ${customName} (${customDuration} min)`;
      }

      // asignaciones (ignora centinelas)
      if (employeeId && employeeId !== NONE_EMP) payload.employeeId = employeeId;
      if (resourceId && resourceId !== NONE_RES) payload.resourceId = resourceId;

      const res = await fetch("/api/calendar/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "No se pudo crear la reserva");
        return;
      }

      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

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
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona ubicación" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.title}{l.city ? ` · ${l.city}` : ""}{l.timezone ? ` · ${l.timezone}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha *</Label>
              <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
            </div>
            <div>
              <Label>Hora inicio *</Label>
              <Input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} />
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
              <Select value={serviceId} onValueChange={setServiceId} disabled={!locationId || servicesLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={servicesLoading ? "Cargando servicios…" : "Selecciona servicio"} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {s.durationMin} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Nombre servicio</Label>
                  <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Descripción breve" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Duración (min)</Label>
                  <Input
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
              <Select
                value={employeeId}
                onValueChange={setEmployeeId}
                disabled={!locationId || employeesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={employeesLoading ? "Cargando empleados…" : "Selecciona empleado"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_EMP}>— Sin asignar —</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name || e.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Recurso (opcional)</Label>
              <Select
                value={resourceId}
                onValueChange={setResourceId}
                disabled={!locationId || resourcesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={resourcesLoading ? "Cargando recursos…" : "Selecciona recurso"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_RES}>— Sin asignar —</SelectItem>
                  {resources.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name || r.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cliente y notas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Cliente (opcional)</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="col-span-2">
              <Label>Notas</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Información adicional..." />
            </div>
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
