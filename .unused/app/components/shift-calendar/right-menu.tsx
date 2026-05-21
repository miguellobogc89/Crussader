// app/components/shift-calendar/right-menu.tsx
"use client";

import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

type Holiday = {
  id: string;
  date: string;
  name: string;
  isClosed: boolean;
  locationId?: string | null;
};

function holidayDateKey(iso: string) {
  return String(iso).slice(0, 10);
}

export default function RightMenu({
  selectedDay,
  selectedDayHolidays,
}: {
  selectedDay: Date;
  selectedDayHolidays: Holiday[];
}) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">
          {new Intl.DateTimeFormat("es-ES", {
            timeZone: "Europe/Madrid",
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(selectedDay)}
        </div>
        <Badge className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-100">
          {selectedDayHolidays.length} festivos
        </Badge>
      </div>

      <div className="mt-4 space-y-2">
        {selectedDayHolidays.length === 0 ? (
          <div className="text-sm text-slate-500">No hay festivos ese día.</div>
        ) : (
          selectedDayHolidays.map((h) => (
            <div key={h.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-800">
                    {h.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {h.isClosed ? "Cerrado" : "Abierto"} · {holidayDateKey(h.date)}
                  </div>
                </div>
                <Badge
                  className={[
                    "rounded-lg",
                    h.isClosed
                      ? "bg-rose-100 text-rose-700 hover:bg-rose-100"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                  ].join(" ")}
                >
                  {h.isClosed ? "Cierra" : "Abre"}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <div className="text-xs font-semibold text-slate-600">Siguiente paso</div>
        <div className="mt-2 text-sm text-slate-600">
          Aquí luego listamos <span className="font-semibold">turnos</span> y{" "}
          <span className="font-semibold">bajas/vacaciones</span>.
        </div>
      </div>
    </Card>
  );
}
