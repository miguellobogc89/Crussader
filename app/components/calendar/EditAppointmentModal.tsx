"use client";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";

type EmployeeLite = { id: string; name: string };
type ResourceLite = { id: string; name: string };
type Appointment = {
  id: string;
  locationId: string;
  serviceId: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  status?: "PENDING"|"BOOKED"|"COMPLETED"|"CANCELLED"|"NO_SHOW"|null;
  employeeId?: string | null;
  resourceId?: string | null;
  customerName?: string | null;
  notes?: string | null;
};

const NONE_EMP = "__none_emp__";
const NONE_RES = "__none_res__";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appt: Appointment;                 // ← datos ya cargados (precargado)
  employees?: EmployeeLite[];        // opcional: listas ya en memoria
  resources?: ResourceLite[];
  onSaved?: () => void;              // refrescar lista
};

export default function EditAppointmentModal({ open, onOpenChange, appt, employees = [], resources = [], onSaved }: Props) {
  // precarga sin fetch
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [status, setStatus] = useState<NonNullable<Appointment["status"]>>("BOOKED");
  const [employeeId, setEmployeeId] = useState<string>(NONE_EMP);
  const [resourceId, setResourceId] = useState<string>(NONE_RES);
  const [customerName, setCustomerName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // hidrata cuando se abra o cambie appt
  useEffect(() => {
    if (!open || !appt) return;
    setMsg("");
    const d = new Date(appt.startAt);
    setDateStr(d.toISOString().slice(0, 10));
    setTimeStr(d.toISOString().slice(11, 16));
    setStatus((appt.status as any) || "BOOKED");
    setEmployeeId(appt.employeeId || NONE_EMP);
    setResourceId(appt.resourceId || NONE_RES);
    setCustomerName(appt.customerName || "");
    setNotes(appt.notes || "");
  }, [open, appt]);

  const canSubmit = useMemo(() => !!dateStr && !!timeStr, [dateStr, timeStr]);

  async function handleSave() {
    try {
      setLoading(true);
      setMsg("");
      // solo mandamos lo que cambió (simple y robusto)
      const startAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
      const payload: any = {};
      if (startAt !== appt.startAt) payload.startAt = startAt;
      if (status && status !== appt.status) payload.status = status;
      if ((employeeId === NONE_EMP ? null : employeeId) !== (appt.employeeId ?? null)) {
        payload.employeeId = employeeId === NONE_EMP ? null : employeeId;
      }
      if ((resourceId === NONE_RES ? null : resourceId) !== (appt.resourceId ?? null)) {
        payload.resourceId = resourceId === NONE_RES ? null : resourceId;
      }
      if ((customerName || null) !== (appt.customerName ?? null)) payload.customerName = customerName || null;
      if ((notes || null) !== (appt.notes ?? null)) payload.notes = notes || null;

      if (Object.keys(payload).length === 0) {
        onOpenChange(false);
        return;
      }

      const res = await fetch(`/api/calendar/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : { error: await res.text() };
      if (!res.ok || data?.error) throw new Error(data?.error || `HTTP ${res.status}`);

      onOpenChange(false);
      onSaved?.();
    } catch (e: any) {
      setMsg(e.message || "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Editar cita</DialogTitle></DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={dateStr} onChange={(e)=>setDateStr(e.target.value)} />
            </div>
            <div>
              <Label>Hora</Label>
              <Input type="time" value={timeStr} onChange={(e)=>setTimeStr(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Estado</Label>
            <Select value={status || "BOOKED"} onValueChange={(v)=>setStatus(v as any)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">PENDIENTE</SelectItem>
                <SelectItem value="BOOKED">RESERVADA</SelectItem>
                <SelectItem value="COMPLETED">COMPLETADA</SelectItem>
                <SelectItem value="CANCELLED">CANCELADA</SelectItem>
                <SelectItem value="NO_SHOW">NO SHOW</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Empleado</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_EMP}>— Sin asignar —</SelectItem>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name || e.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recurso</Label>
              <Select value={resourceId} onValueChange={setResourceId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_RES}>— Sin asignar —</SelectItem>
                  {resources.map(r => <SelectItem key={r.id} value={r.id}>{r.name || r.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Cliente</Label>
            <Input value={customerName} onChange={(e)=>setCustomerName(e.target.value)} placeholder="Nombre del cliente" />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea rows={2} value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Información adicional..." />
          </div>

          {msg && <p className="text-sm">{msg}</p>}

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleSave} disabled={!canSubmit || loading}>
              {loading ? "Guardando…" : "Guardar cambios"}
            </Button>
            <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
