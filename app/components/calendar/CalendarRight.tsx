// app/components/calendar/CalendarRight.tsx
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Calendar as CalIcon,
  Phone,
  Clock,
  Mail,
  Users,
  Boxes,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";

type EmployeeLite = { id: string; name?: string | null };
type ResourceLite = { id: string; name?: string | null };

type Appointment = {
  id: string;
  locationId: string; // no se muestra ya
  serviceId: string;
  startAt: string;
  endAt: string;
  status?: "PENDING" | "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | string | null;
  // fallback si no nos pasas customer:
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
  // confirmación explícita opcional
  confirmed?: boolean | null;
  // enriquecidos opcionales
  employees?: EmployeeLite[];
  resources?: ResourceLite[];
  service?: { id: string; name: string; durationMin: number; color?: string | null } | null;
};

type ServiceLite = { id: string; name: string; durationMin: number; color?: string | null };
type Customer = { id: string; name?: string | null; phone?: string | null; email?: string | null };

export default function CalendarRight({
  appointment,
  services,
  customer,
  onCancelAppointment,
  onRequestConfirmation,
}: {
  appointment: Appointment | null;
  services: ServiceLite[];
  customer?: Customer | null;
  onCancelAppointment?: (appointmentId: string) => Promise<void> | void;
  onRequestConfirmation?: (appointmentId: string) => Promise<void> | void;
}) {
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  return (
    <div
      className="
        hidden lg:flex
        w-[360px] shrink-0
        h-full
        bg-white
        rounded-xl
        shadow-sm
        overflow-hidden
      "
    >
      <div className="flex-1 p-4 overflow-hidden">
        {!appointment ? (
          <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm h-full border-white">
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
        ) : (
          <RightDetailsCard
            appointment={appointment}
            services={services}
            customer={customer}
            cancelLoading={cancelLoading}
            confirmLoading={confirmLoading}
            onCancel={async () => {
              if (!onCancelAppointment) return;
              try {
                setCancelLoading(true);
                await onCancelAppointment(appointment.id);
              } finally {
                setCancelLoading(false);
              }
            }}
            onRequestConfirmation={async () => {
              if (!onRequestConfirmation) return;
              try {
                setConfirmLoading(true);
                await onRequestConfirmation(appointment.id);
              } finally {
                setConfirmLoading(false);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function RightDetailsCard({
  appointment,
  services,
  customer,
  cancelLoading,
  confirmLoading,
  onCancel,
  onRequestConfirmation,
}: {
  appointment: Appointment;
  services: ServiceLite[];
  customer?: Customer | null;
  cancelLoading: boolean;
  confirmLoading: boolean;
  onCancel?: () => void;
  onRequestConfirmation?: () => void;
}) {
  const [testLoading, setTestLoading] = useState(false);

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

  const start = safeDate(appointment.startAt);
  const end = safeDate(appointment.endAt);

  const service =
    appointment.service ||
    (appointment.serviceId ? services.find((s) => s.id === appointment.serviceId) || null : null);

  const employees = appointment.employees ?? [];
  const resources = appointment.resources ?? [];

  const customerName = (customer?.name ?? appointment.customerName) || "(sin nombre)";
  const customerPhone = (customer?.phone ?? appointment.customerPhone ?? "").trim();
  const customerEmail = customer?.email ?? appointment.customerEmail ?? "";

  const isConfirmed =
    (appointment.confirmed ??
      (appointment.status === "BOOKED" || appointment.status === "COMPLETED")) === true;

  // ✅ booleans (no funciones)
  const canCancel = appointment.status !== "CANCELLED" && appointment.status !== "NO_SHOW";
  const canAskConfirm = !isConfirmed && appointment.status !== "CANCELLED" && appointment.status !== "NO_SHOW";

  async function handleTestWhatsApp() {
    if (!customerPhone) {
      alert("No hay teléfono del cliente en la cita.");
      return;
    }
    try {
      setTestLoading(true);
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customerPhone.replace(/\s+/g, ""),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        console.error("WhatsApp error:", data);
        alert("No se pudo enviar: " + (data?.error?.message ?? JSON.stringify(data)));
      } else {
        alert("WhatsApp de prueba enviado ✅");
      }

    } catch (e) {
      console.error(e);
      alert("Error enviando WhatsApp.");
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalIcon className="h-5 w-5 text-primary" />
          <span className="truncate font-semibold">
            {service ? service.name : "Reserva sin servicio"}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 min-h-0">
        <div className="space-y-4">
          {/* Fecha */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Fecha</Label>
            <p className="font-semibold">{start ? fmtDate.format(start) : "—"}</p>
          </div>

          {/* Inicio / Fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Inicio</Label>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{start ? fmtTime.format(start) : "—"}</span>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Fin</Label>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{end ? fmtTime.format(end) : "—"}</span>
              </p>
            </div>
          </div>

          {/* Recursos y Empleados en horizontal */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium text-muted-foreground">Recursos</Label>
              <p className="text-sm flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                {resources.length ? resources.map((r) => r.name || r.id).join(", ") : "—"}
              </p>
            </div>

            <div className="flex-1">
              <Label className="text-sm font-medium text-muted-foreground">Empleados</Label>
              <p className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                {employees.length ? employees.map((e) => e.name || e.id).join(", ") : "—"}
              </p>
            </div>
          </div>

          {/* Comentario */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Comentario</Label>
            <p className="text-sm">{appointment.notes?.trim() || "—"}</p>
          </div>

          {/* Cliente */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
              <p className="font-semibold">{customerName}</p>
            </div>

            <div className="col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
              <p className="flex items-center gap-2">
                {customerPhone || "—"}
                {customerPhone && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`tel:${customerPhone}`} aria-label="Llamar">
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
                {customerEmail || "—"}
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
              {isConfirmed ? (
                <Badge className="ml-2" variant="default">confirmada</Badge>
              ) : (
                <Badge className="ml-2" variant="outline">sin confirmar</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Acciones */}
      <div className="border-t p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={!canAskConfirm || confirmLoading}
            onClick={onRequestConfirmation}
          >
            {confirmLoading ? "Enviando..." : "Solicitar confirmación"}
          </Button>

          {/* 🧪 Botón de prueba WhatsApp */}
          <Button
            variant="outline"
            disabled={!customerPhone || testLoading}
            onClick={handleTestWhatsApp}
            title={!customerPhone ? "Añade un teléfono al cliente" : undefined}
          >
            {testLoading ? "Probando..." : "Probar WhatsApp"}
          </Button>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={!canCancel || cancelLoading}>
              {cancelLoading ? "Anulando..." : "Anular cita"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Anular esta cita?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se marcará como <strong>cancelada</strong> y
                se eliminará del calendario visible. ¿Seguro que quieres continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Volver</AlertDialogCancel>
              <AlertDialogAction onClick={onCancel}>Sí, anular</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}

/* ===== Helpers locales ===== */
function safeDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

// 🔧 la que faltaba:
function safeStatusText(s: Appointment["status"]) {
  return (typeof s === "string" ? s : "PENDING").toLowerCase();
}
