"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Calendar as CalIcon, Phone, Tag, MapPin, Clock, Mail, Users, Boxes } from "lucide-react";
import { useMemo } from "react";

/** Tipos locales para no depender de la page */
type EmployeeLite = { id: string; name?: string | null };
type ResourceLite = { id: string; name?: string | null };

type AppointmentAny = {
  id: string;
  locationId: string;
  startAt: string;
  endAt: string;
  status?: "PENDING" | "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | string | null;
  // cliente
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  // notas/comentario
  notes?: string | null;
  // variantes de servicio
  serviceId?: string | null;
  service?: { id: string; name: string; durationMin: number; color?: string | null } | null;
  // asignaciones
  employees?: EmployeeLite[];
  resources?: ResourceLite[];
};

type ServiceLite = { id: string; name: string; durationMin: number; color?: string | null };

type Props = {
  appointment: AppointmentAny | null;
  services: ServiceLite[]; // catálogo para resolver serviceId si no viene appointment.service
};

function AppointmentDetailsCard({ appointment, services }: Props) {
  const fmtDate = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        dateStyle: "full",
      }),
    []
  );
  const fmtTime = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const safeStatusText = (s: AppointmentAny["status"]) =>
    (typeof s === "string" ? s : "PENDING").toLowerCase();

  const safeDate = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  if (!appointment) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalIcon className="h-5 w-5 text-primary" />
            Detalles de la Reserva
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <CalIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecciona una reserva para ver los detalles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const start = safeDate(appointment.startAt);
  const end = safeDate(appointment.endAt);

  // Resolver servicio: primero el embebido, si no, por serviceId en catálogo
  const service =
    appointment.service ||
    (appointment.serviceId ? services.find((s) => s.id === appointment.serviceId) || null : null);

  const employees = appointment.employees ?? [];
  const resources = appointment.resources ?? [];

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalIcon className="h-5 w-5 text-primary" />
          Detalles de la Reserva
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Fecha */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Fecha</Label>
            <p className="font-semibold">{start ? fmtDate.format(start) : "—"}</p>
          </div>

          {/* Inicio / Fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Hora de inicio</Label>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{start ? fmtTime.format(start) : "—"}</span>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Hora de fin</Label>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{end ? fmtTime.format(end) : "—"}</span>
              </p>
            </div>
          </div>

          {/* Servicio */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Servicio</Label>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {service ? (
                <span className="font-semibold">
                  {service.name} · {service.durationMin} min
                </span>
              ) : (
                <span className="font-semibold">{appointment.serviceId || "—"}</span>
              )}
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Ubicación</Label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="font-semibold">{appointment.locationId || "—"}</span>
            </div>
          </div>

          {/* Comentario (usa notes) */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Comentario</Label>
            <p className="text-sm">{appointment.notes?.trim() || "—"}</p>
          </div>

          {/* Recursos */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Recursos</Label>
            <p className="text-sm flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              {resources.length
                ? resources.map((r) => r.name || r.id).join(", ")
                : "—"}
            </p>
          </div>

          {/* Empleados */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Empleados</Label>
            <p className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              {employees.length
                ? employees.map((e) => e.name || e.id).join(", ")
                : "—"}
            </p>
          </div>

          {/* Cliente */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
              <p className="font-semibold">{appointment.customerName || "(sin nombre)"}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
              <p className="flex items-center gap-2">
                {appointment.customerPhone || "—"}
                {appointment.customerPhone && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`tel:${appointment.customerPhone}`} aria-label="Llamar">
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </p>
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {appointment.customerEmail || "—"}
              </p>
            </div>
          </div>

          {/* Estado */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
            <div className="mt-1">
              <Badge variant="secondary" className="capitalize">
                {safeStatusText(appointment.status)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AppointmentDetailsCard;
