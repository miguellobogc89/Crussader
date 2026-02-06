"use client";

import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Clock } from "lucide-react";

export type AppointmentLite = {
  id: string;
  startAt: string;
  endAt: string;
  status?: string | null;
  customerName?: string | null;
  serviceId?: string | null;
  service?: { id: string; name: string; durationMin: number } | null;
};

type Props = {
  title?: string;
  appointments: AppointmentLite[];
  onSelectAppointment: (a: AppointmentLite) => void;
};

export default function UpcomingEventsList({
  title = "Citas del día",
  appointments,
  onSelectAppointment,
}: Props) {
  const fmt = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  });

  const safeStatusText = (s: string | null | undefined) =>
    (typeof s === "string" ? s : "PENDING").toLowerCase();

  return (
    <div className="space-y-2 mt-4">
      <h3 className="font-semibold text-lg">{title}</h3>

      {appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay citas.</p>
      ) : (
        appointments.map((a) => {
          const start = new Date(a.startAt);
          const end = new Date(a.endAt);
          const when = `${fmt.format(start)} — ${fmt.format(end)}`;
          const serviceName = a.service?.name ?? a.serviceId ?? "—";
          const duration = a.service?.durationMin
            ? `${a.service.durationMin} min`
            : "";

          return (
            <Card
            key={a.id}
            className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 border rounded-md border-l-4 border-l-primary"
            onClick={() => onSelectAppointment(a)}   // <-- pasamos la cita completa
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{when}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {serviceName} {duration && `· ${duration}`}
                  </div>
                </div>
                <Badge variant="secondary" className="capitalize h-fit">
                  {safeStatusText(a.status)}
                </Badge>
              </div>

              {a.customerName && (
                <div className="mt-1 text-sm text-muted-foreground">
                  Cliente: {a.customerName}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
