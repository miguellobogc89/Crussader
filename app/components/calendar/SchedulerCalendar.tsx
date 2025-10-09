"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/app/components/ui/calendar";
import { Badge } from "@/app/components/ui/badge";
import { Calendar as CalIcon, Clock } from "lucide-react";
import { useMemo } from "react";
import type { Appointment } from "@/app/components/calendar/CalendarOnly/types";


type Props = {
  selectedView: "month" | "week" | "day";
  onChangeView: (v: "month" | "week" | "day") => void;
  selectedDate?: Date;
  onChangeDate: (d?: Date) => void;
  appointments: Appointment[];
  onSelectAppointment: (a: Appointment | null) => void;
};

export default function SchedulerCalendar({
  selectedView,
  onChangeView,
  selectedDate,
  onChangeDate,
  appointments,
  onSelectAppointment,
}: Props) {
  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const renderWhen = (a: Appointment) => {
    try {
      return `${fmt.format(new Date(a.startAt))} — ${fmt.format(new Date(a.endAt))}`;
    } catch {
      return "Hora";
    }
  };

  // Helpers seguros
  const safeStatusText = (status: Appointment["status"] | null | undefined) =>
    (typeof status === "string" ? status : "PENDING").toLowerCase();

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalIcon className="h-5 w-5 text-primary" />
            Calendario
          </CardTitle>
          <Tabs value={selectedView} onValueChange={(v) => onChangeView(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="month">Mes</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="day">Día</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedView}>
          <TabsContent value="month" className="space-y-4">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={onChangeDate}
              className="rounded-md border border-border/50 bg-background/50 backdrop-blur-sm"
            />

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">
                Citas del {selectedDate?.toLocaleDateString("es-ES")}
              </h3>
              <div className="space-y-2">
                {appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay citas.</p>
                ) : (
                  appointments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 border rounded-md border-l-4 border-l-primary"
                      onClick={() => onSelectAppointment(a)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{renderWhen(a)}</span>
                          <Badge variant="outline" className="text-xs">{a.serviceId}</Badge>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {safeStatusText(a.status)}
                        </Badge>
                      </div>
                      {a.customerName && (
                        <div className="mt-1 text-sm text-muted-foreground">Cliente: {a.customerName}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="week">
            <div className="text-sm text-muted-foreground">
              Vista semanal pendiente — conectaremos con <code>/api/calendar/slots</code> después.
            </div>
          </TabsContent>

          <TabsContent value="day">
            <div className="text-sm text-muted-foreground">
              Vista diaria pendiente — usaremos las citas del día seleccionado.
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
