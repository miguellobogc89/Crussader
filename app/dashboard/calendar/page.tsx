"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { SidebarProvider } from "@/app/components/ui/sidebar";

import EmployeeList, { Employee } from "@/app/components/calendar/EmployeeList";
import ResourceList, { Resource } from "@/app/components/calendar/ResourceList";
import CreateAppointmentModal from "@/app/components/calendar/CreateAppointmentModal";

import CalendarOnly from "@/app/components/calendar/CalendarOnly";
import UpcomingEventsList from "@/app/components/calendar/UpcomingEventsList";
import AppointmentDetailsCard from "@/app/components/calendar/AppointmentDetailsCard";

export type Appointment = {
  id: string;
  locationId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status?: "PENDING" | "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | null;
  employeeId?: string | null;
  resourceId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
};

export type ServiceLite = { id: string; name: string; durationMin: number; color?: string | null };

export default function CalendarPage() {
  // Vista + fecha seleccionada
  const [selectedView, setSelectedView] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Modal crear
  const [showCreate, setShowCreate] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(new Date());

  // Filtro principal
  const [locationId, setLocationId] = useState("loc_demo_centro_01");

  // Datos
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceLite[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  // UI auxiliar
  const [listMsg, setListMsg] = useState<string>("");
  const [empMsg, setEmpMsg] = useState("");
  const [resMsg, setResMsg] = useState("");

  // Selecciones
  const [selectedReserva, setSelectedReserva] = useState<Appointment | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);

  // Título “Citas del …”
  const fmtDayTitle = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "2-digit",
      }),
    []
  );

  // ===== Límites de día en horario LOCAL (clave para que la lista siga al calendario) =====
  const dayBoundsLocalISO = (d: Date) => {
    const start = new Date(d);
    start.setHours(0, 0, 0, 0); // 00:00 local
    const end = new Date(d);
    end.setHours(23, 59, 59, 999); // 23:59:59.999 local
    return { fromISO: start.toISOString(), toISO: end.toISOString() };
  };

  // ===== Fetchers =====
async function fetchAppointmentsForSelectedDay() {
  setSelectedReserva(null);
  if (!locationId || !selectedDate) return;

  const { fromISO, toISO } = dayBoundsLocalISO(selectedDate); // si no tienes esta helper, usa tu actual
  setListMsg("⏳ Cargando citas del día…");
  try {
    const res = await fetch(
      `/api/calendar/appointments?locationId=${encodeURIComponent(locationId)}&from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (!res.ok || data.error) {
      setListMsg(`❌ ${data.error || "Error"}`);
      setAppointments([]);
      return;
    }
    const items = Array.isArray(data.items) ? data.items : [];
    setAppointments(items);

    // 👇 NUEVO: seleccionar la primera cita si existe
    setSelectedReserva(items[0] ?? null);

    setListMsg(`✅ ${items.length} citas`);
  } catch (e: any) {
    setListMsg(`❌ ${e.message}`);
    setAppointments([]);
  }
}


  async function fetchEmployees() {
    if (!locationId) return;
    setEmpMsg("⏳ Cargando empleados…");
    try {
      const res = await fetch(`/api/calendar/employees?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setEmpMsg(`❌ ${data.error || "Error"}`);
        setEmployees([]);
        return;
      }
      setEmployees(Array.isArray(data.items) ? data.items : []);
      setEmpMsg(`✅ ${data.items?.length || 0}`);
    } catch (e: any) {
      setEmpMsg(`❌ ${e.message}`);
      setEmployees([]);
    }
  }

  async function fetchResources() {
    if (!locationId) return;
    setResMsg("⏳ Cargando recursos…");
    try {
      const res = await fetch(`/api/calendar/resources?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setResMsg(`❌ ${data.error || "Error"}`);
        setResources([]);
        return;
      }
      setResources(Array.isArray(data.items) ? data.items : []);
      setResMsg(`✅ ${data.items?.length || 0}`);
    } catch (e: any) {
      setResMsg(`❌ ${e.message}`);
      setResources([]);
    }
  }

  async function fetchServices() {
    if (!locationId) return;
    try {
      const res = await fetch(`/api/calendar/services?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
      const data = await res.json();
      setServices(Array.isArray(data.items) ? data.items : []);
    } catch {
      setServices([]);
    }
  }

  // Auto-cargar al cambiar location
  useEffect(() => {
    if (!locationId) return;
    fetchEmployees();
    fetchResources();
    fetchServices();
    fetchAppointmentsForSelectedDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  // Recargar al cambiar fecha
  useEffect(() => {
    if (locationId && selectedDate) fetchAppointmentsForSelectedDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Helpers UI selección
  const toggleEmp = (id: string) =>
    setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleRes = (id: string) =>
    setSelectedResourceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

const handleSelectFromList = (appt: any) => {
  setSelectedReserva(appt);
};

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/30 to-background">
        <main className="flex-1 p-6 overflow-auto mx-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          </div>

          {/* Filtros rápidos */}
          <Card className="mb-5 shadow-lg border-0 bg-gradient-to-r from-card/80 to-card backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Filtros:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">locationId</Label>
                  <Input
                    className="h-8 w-56"
                    placeholder="loc_demo_centro_01"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Fecha</Label>
                  <Input
                    className="h-8"
                    type="date"
                    value={selectedDate.toISOString().slice(0, 10)}
                    onChange={(e) => {
                      const d = new Date(e.target.value + "T00:00:00");
                      setSelectedDate(d);
                    }}
                  />
                </div>
                <Button onClick={fetchAppointmentsForSelectedDay} variant="outline" className="h-8">
                  Refrescar
                </Button>
                {listMsg && <span className="text-sm">{listMsg}</span>}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* IZQUIERDA */}
            <div className="lg:col-span-1 space-y-6">
              <EmployeeList items={employees} selectedIds={selectedEmployeeIds} statusText={empMsg} onToggle={toggleEmp} />
              <ResourceList items={resources} selectedIds={selectedResourceIds} statusText={resMsg} onToggle={toggleRes} />
            </div>

            {/* CENTRO */}
            <div className="lg:col-span-2">
              <CalendarOnly
                selectedView={selectedView}
                onChangeView={setSelectedView}
                selectedDate={selectedDate}
                onChangeDate={(d) => {
                  if (d) setSelectedDate(d); // solo actualiza si hay fecha
                }}
              />

              <UpcomingEventsList
                title={selectedDate ? `Citas del ${fmtDayTitle.format(selectedDate)}` : "Citas del día"}
                appointments={appointments}
                onSelectAppointment={handleSelectFromList}
              />
            </div>

            {/* DERECHA */}
            <div className="lg:col-span-1">
              <AppointmentDetailsCard appointment={selectedReserva} services={services} />
            </div>
          </div>
        </main>
      </div>

      {/* Modal crear */}
      <CreateAppointmentModal
        open={showCreate}
        onOpenChange={(v) => setShowCreate(v)}
        defaultDate={draftDate}
        onCreated={fetchAppointmentsForSelectedDay}
      />
    </SidebarProvider>
  );
}
